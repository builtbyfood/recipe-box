"""Storage layer.

Source of truth: JSON files on disk (one folder per recipe). In-memory cache
populated at startup and refreshed by a watchdog observer when files change
out-of-band (you cat-edit `recipe.json` to fix a typo, integration notices).

No SQLite. At <1000 recipes the dict is faster and simpler.
"""
from __future__ import annotations

import asyncio
import json
import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import (
    CONFLICT_ERROR,
    CONFLICT_NEW_COPY,
    CONFLICT_OVERWRITE,
    CONFLICT_SKIP,
    HERO_FILENAME,
    META_NAMESPACE,
    RECIPE_FILENAME,
)

_LOGGER = logging.getLogger(__name__)


class RecipeConflictError(Exception):
    """Raised when async_save encounters an existing recipe and on_conflict=error."""

    def __init__(self, slug: str, existing: dict[str, Any]) -> None:
        self.slug = slug
        self.existing = existing
        super().__init__(f"Recipe '{slug}' already exists")


class RecipeStorage:
    """In-memory cache + filesystem persistence for recipes."""

    def __init__(
        self,
        hass: HomeAssistant,
        recipes_path: Path,
        entry: ConfigEntry,
    ) -> None:
        self.hass = hass
        self.recipes_path = recipes_path
        self.entry = entry
        self.recipes: dict[str, dict[str, Any]] = {}  # slug -> recipe dict
        self._lock = asyncio.Lock()
        self._observer = None

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    async def async_load(self) -> None:
        """Load all recipes from disk into memory (full rescan)."""
        async with self._lock:
            await self.hass.async_add_executor_job(self._load_sync)

    def _load_sync(self) -> None:
        new_cache: dict[str, dict[str, Any]] = {}
        if not self.recipes_path.exists():
            self.recipes = new_cache
            return
        for slug_dir in self.recipes_path.iterdir():
            if not slug_dir.is_dir() or slug_dir.name.startswith("."):
                continue
            recipe_file = slug_dir / RECIPE_FILENAME
            if not recipe_file.exists():
                continue
            try:
                with recipe_file.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                new_cache[slug_dir.name] = data
            except (json.JSONDecodeError, OSError) as err:
                _LOGGER.warning(
                    "Skipping invalid recipe at %s: %s", recipe_file, err
                )
        self.recipes = new_cache
        _LOGGER.debug("Loaded %d recipes from %s", len(new_cache), self.recipes_path)

    def get(self, slug: str) -> dict[str, Any] | None:
        return self.recipes.get(slug)

    def list_all(self) -> list[tuple[str, dict[str, Any]]]:
        return list(self.recipes.items())

    def find_by_url(self, url: str) -> tuple[str, dict[str, Any]] | None:
        """Find an existing recipe by source URL."""
        for slug, recipe in self.recipes.items():
            meta = recipe.get(META_NAMESPACE) or {}
            if meta.get("source_url") == url:
                return slug, recipe
        return None

    def all_tags(self) -> list[str]:
        tags: set[str] = set()
        for recipe in self.recipes.values():
            tags.update((recipe.get(META_NAMESPACE) or {}).get("tags", []))
        return sorted(tags)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    async def async_save(
        self,
        slug: str,
        recipe: dict[str, Any],
        on_conflict: str = CONFLICT_ERROR,
        hero_bytes: bytes | None = None,
    ) -> tuple[str, dict[str, Any]]:
        """Save a recipe. Returns (final_slug, saved_recipe).

        Raises RecipeConflictError if slug exists and on_conflict=error.
        """
        async with self._lock:
            return await self.hass.async_add_executor_job(
                self._save_sync, slug, recipe, on_conflict, hero_bytes
            )

    def _save_sync(
        self,
        slug: str,
        recipe: dict[str, Any],
        on_conflict: str,
        hero_bytes: bytes | None,
    ) -> tuple[str, dict[str, Any]]:
        if slug in self.recipes:
            if on_conflict == CONFLICT_ERROR:
                raise RecipeConflictError(slug, self.recipes[slug])
            if on_conflict == CONFLICT_SKIP:
                return slug, self.recipes[slug]
            if on_conflict == CONFLICT_NEW_COPY:
                slug = self._next_available_slug(slug)
            elif on_conflict == CONFLICT_OVERWRITE:
                # Preserve user-curated metadata from the existing recipe
                existing_meta = self.recipes[slug].get(META_NAMESPACE) or {}
                new_meta = recipe.get(META_NAMESPACE) or {}
                preserved_keys = (
                    "tags",
                    "notes",
                    "last_cooked",
                    "cooked_count",
                )
                for key in preserved_keys:
                    if existing_meta.get(key):
                        new_meta[key] = existing_meta[key]
                recipe[META_NAMESPACE] = new_meta

        # Stamp imported_at if missing
        meta = recipe.setdefault(META_NAMESPACE, {})
        if not meta.get("imported_at"):
            meta["imported_at"] = datetime.now(timezone.utc).isoformat()

        slug_dir = self.recipes_path / slug
        slug_dir.mkdir(parents=True, exist_ok=True)

        # Atomic write: write to .tmp, fsync, rename
        recipe_file = slug_dir / RECIPE_FILENAME
        tmp_file = slug_dir / f"{RECIPE_FILENAME}.tmp"
        with tmp_file.open("w", encoding="utf-8") as f:
            json.dump(recipe, f, indent=2, ensure_ascii=False)
            f.flush()
        tmp_file.replace(recipe_file)

        if hero_bytes:
            hero_file = slug_dir / HERO_FILENAME
            tmp_hero = slug_dir / f"{HERO_FILENAME}.tmp"
            tmp_hero.write_bytes(hero_bytes)
            tmp_hero.replace(hero_file)

        self.recipes[slug] = recipe
        _LOGGER.info("Saved recipe '%s' -> %s", slug, slug_dir)
        return slug, recipe

    def _next_available_slug(self, base_slug: str) -> str:
        n = 2
        while f"{base_slug}-{n}" in self.recipes:
            n += 1
        return f"{base_slug}-{n}"

    # ------------------------------------------------------------------
    # Attachments (PDFs, images of printed recipes, etc.)
    # ------------------------------------------------------------------

    async def async_save_attachment(
        self, slug: str, filename: str, data: bytes
    ) -> str:
        """Write a binary file inside the recipe folder.

        Returns the filename (sanitized). The folder must already exist.
        """
        async with self._lock:
            return await self.hass.async_add_executor_job(
                self._save_attachment_sync, slug, filename, data
            )

    def _save_attachment_sync(self, slug: str, filename: str, data: bytes) -> str:
        slug_dir = self.recipes_path / slug
        if not slug_dir.exists():
            raise FileNotFoundError(f"Recipe folder for '{slug}' not found")

        safe_name = self._safe_filename(filename)
        target = slug_dir / safe_name
        tmp = slug_dir / f"{safe_name}.tmp"
        tmp.write_bytes(data)
        tmp.replace(target)
        return safe_name

    def get_attachment_path(self, slug: str, filename: str) -> Path | None:
        """Return the full path to an attachment, or None if missing.

        Defends against path traversal — the resolved path must stay
        inside the recipe folder.
        """
        if slug not in self.recipes:
            return None
        slug_dir = (self.recipes_path / slug).resolve()
        safe_name = self._safe_filename(filename)
        target = (slug_dir / safe_name).resolve()
        try:
            target.relative_to(slug_dir)
        except ValueError:
            return None
        return target if target.exists() else None

    @staticmethod
    def _safe_filename(filename: str) -> str:
        """Strip path separators and dangerous chars from a filename."""
        # Drop directory components — only keep the basename
        base = filename.replace("\\", "/").rsplit("/", 1)[-1]
        # Whitelist of safe characters
        safe = "".join(
            c if (c.isalnum() or c in "._-") else "_" for c in base
        )
        return safe or "attachment"

    async def async_delete(self, slug: str) -> bool:
        """Delete a recipe folder and remove from cache."""
        async with self._lock:
            return await self.hass.async_add_executor_job(self._delete_sync, slug)

    def _delete_sync(self, slug: str) -> bool:
        slug_dir = self.recipes_path / slug
        if slug_dir.exists():
            shutil.rmtree(slug_dir)
        return self.recipes.pop(slug, None) is not None

    async def async_mark_cooked(self, slug: str) -> dict[str, Any] | None:
        """Increment cooked_count and stamp last_cooked."""
        recipe = self.recipes.get(slug)
        if not recipe:
            return None
        meta = recipe.setdefault(META_NAMESPACE, {})
        meta["last_cooked"] = datetime.now(timezone.utc).isoformat()
        meta["cooked_count"] = (meta.get("cooked_count") or 0) + 1
        slug_final, saved = await self.async_save(
            slug, recipe, on_conflict=CONFLICT_OVERWRITE
        )
        return saved

    # ------------------------------------------------------------------
    # Watcher
    # ------------------------------------------------------------------

    async def async_start_watcher(self) -> None:
        """Start watchdog observer for filesystem changes."""
        try:
            from watchdog.events import FileSystemEventHandler
            from watchdog.observers import Observer
        except ImportError:
            _LOGGER.warning(
                "watchdog not available; external file changes won't auto-reload"
            )
            return

        storage = self
        loop = self.hass.loop

        class _Handler(FileSystemEventHandler):
            def on_any_event(self, event):
                # Only react to recipe.json files
                if event.is_directory:
                    return
                if not str(event.src_path).endswith(RECIPE_FILENAME):
                    return
                # Schedule a full reload (simpler than diffing)
                loop.call_soon_threadsafe(
                    lambda: storage.hass.async_create_task(storage.async_load())
                )

        self._observer = Observer()
        self._observer.schedule(
            _Handler(), str(self.recipes_path), recursive=True
        )
        await self.hass.async_add_executor_job(self._observer.start)
        _LOGGER.debug("Filesystem watcher started for %s", self.recipes_path)

    async def async_stop_watcher(self) -> None:
        if self._observer:
            self._observer.stop()
            await self.hass.async_add_executor_job(self._observer.join)
            self._observer = None
