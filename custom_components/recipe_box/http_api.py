"""HTTP API for Recipe Box.

Exposed under /api/recipe_box. All endpoints require HA auth (the standard
HomeAssistantView mechanism). The Lovelace card uses these to drive the
preview / review / save flow.
"""
from __future__ import annotations

import logging
from typing import Any

import aiohttp
import async_timeout
from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import CONFLICT_ERROR, CONFLICT_OPTIONS, META_NAMESPACE
from .parser import (
    RecipeParseError,
    parse_recipe_html,
    parse_recipe_text,
    slugify,
)
from .storage import RecipeConflictError, RecipeStorage

_LOGGER = logging.getLogger(__name__)

# Browser-like headers. Identifying ourselves as "HomeAssistant-RecipeBox"
# triggers immediate blocks from sites with bot protection (Food Network,
# NYT, Bon Appétit, anything behind Cloudflare). A plausible Chrome UA
# combined with full Accept/Sec-Fetch headers gets through most defenses.
BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}


def _format_fetch_error(status: int, host: str) -> str:
    """User-friendly error message when a site blocks our fetch."""
    if status == 403:
        return (
            f"{host} blocked the request (HTTP 403). This site has bot "
            f"protection. Try sharing the URL from your phone's browser "
            f"to the HA Companion app instead — it'll fetch with your "
            f"normal browser cookies."
        )
    if status == 404:
        return f"Recipe not found at this URL (HTTP 404)."
    if status == 429:
        return f"{host} rate-limited the request. Try again in a minute."
    if status >= 500:
        return f"{host} returned a server error (HTTP {status})."
    return f"{host} returned HTTP {status}."


def async_register_http_views(
    hass: HomeAssistant, storage: RecipeStorage
) -> None:
    """Register all HTTP views."""
    hass.http.register_view(RecipePreviewView(storage))
    hass.http.register_view(RecipeListView(storage))
    hass.http.register_view(RecipeDetailView(storage))
    hass.http.register_view(RecipeMarkCookedView(storage))
    hass.http.register_view(RecipeShoppingPreviewView(storage))
    hass.http.register_view(RecipeUploadView(storage))
    hass.http.register_view(RecipeAttachmentView(storage))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _fetch_url(
    hass: HomeAssistant, url: str, *, binary: bool = False, timeout: int = 20
) -> tuple[int, bytes | str]:
    session = async_get_clientsession(hass)
    async with async_timeout.timeout(timeout):
        async with session.get(url, headers=BROWSER_HEADERS) as resp:
            data: bytes | str = (
                await resp.read() if binary else await resp.text()
            )
            return resp.status, data


def _summarize(slug: str, recipe: dict[str, Any]) -> dict[str, Any]:
    """Compact representation for the library list."""
    meta = recipe.get(META_NAMESPACE) or {}

    # Join ingredients into a single searchable string (for the
    # frontend's "search across ingredients" feature). Trim to a
    # reasonable cap to keep the response size in check.
    ingredients_text = " ".join(recipe.get("recipeIngredient", []) or [])
    if len(ingredients_text) > 800:
        ingredients_text = ingredients_text[:800]

    return {
        "slug": slug,
        "name": recipe.get("name"),
        "image": recipe.get("image"),
        "totalTime": recipe.get("totalTime"),
        "recipeYield": recipe.get("recipeYield"),
        "recipeCategory": recipe.get("recipeCategory"),
        "tags": meta.get("tags", []),
        "last_cooked": meta.get("last_cooked"),
        "cooked_count": meta.get("cooked_count", 0),
        "imported_at": meta.get("imported_at"),
        "source_host": meta.get("source_host"),
        "source_type": meta.get("source_type", "web"),
        "has_hero": bool(recipe.get("image")),
        "ingredients_text": ingredients_text,
    }


class _BaseView(HomeAssistantView):
    requires_auth = True

    def __init__(self, storage: RecipeStorage) -> None:
        self.storage = storage


# ---------------------------------------------------------------------------
# Views
# ---------------------------------------------------------------------------


class RecipePreviewView(_BaseView):
    """POST /api/recipe_box/preview { url } -> parsed recipe (no save)."""

    url = "/api/recipe_box/preview"
    name = "api:recipe_box:preview"

    async def post(self, request: web.Request) -> web.Response:
        try:
            payload = await request.json()
        except ValueError:
            return self.json_message("Invalid JSON", 400)

        recipe_url = (payload.get("url") or "").strip()
        provided_html = payload.get("html")
        provided_text = payload.get("text")

        # Text-paste mode: skip the URL requirement entirely. URL becomes
        # an optional source label.
        if provided_text:
            try:
                recipe = await request.app["hass"].async_add_executor_job(
                    parse_recipe_text, provided_text, recipe_url or "pasted"
                )
            except RecipeParseError as err:
                return self.json_message(str(err), 422)
            return self._respond_with_preview(recipe, recipe_url)

        if not recipe_url:
            return self.json_message("Missing url", 400)

        hass: HomeAssistant = request.app["hass"]

        # If the caller provided HTML directly (mobile share-target flow),
        # skip the server-side fetch entirely. This is how we get past
        # Cloudflare/bot-protected sites — the phone fetches with its
        # browser cookies and posts the rendered HTML to us.
        if provided_html:
            html = provided_html
        else:
            try:
                status, html = await _fetch_url(hass, recipe_url)
            except (aiohttp.ClientError, TimeoutError) as err:
                return self.json_message(f"Failed to fetch URL: {err}", 502)

            if status >= 400:
                from urllib.parse import urlparse

                host = urlparse(recipe_url).netloc
                return self.json_message(
                    _format_fetch_error(status, host), 502
                )

        try:
            recipe = await hass.async_add_executor_job(
                parse_recipe_html, html, recipe_url
            )
        except RecipeParseError as err:
            return self.json_message(str(err), 422)

        return self._respond_with_preview(recipe, recipe_url)

    def _respond_with_preview(
        self, recipe: dict[str, Any], recipe_url: str
    ) -> web.Response:
        suggested_slug = recipe[META_NAMESPACE]["suggested_slug"]
        conflicts: dict[str, Any] = {}

        if suggested_slug in self.storage.recipes:
            conflicts["slug_taken"] = suggested_slug
            conflicts["existing_at_slug"] = _summarize(
                suggested_slug, self.storage.recipes[suggested_slug]
            )

        if recipe_url:
            url_match = self.storage.find_by_url(recipe_url)
            if url_match:
                conflicts["url_already_imported"] = url_match[0]
                conflicts["existing_by_url"] = _summarize(*url_match)

        return self.json(
            {
                "recipe": recipe,
                "conflicts": conflicts,
                "existing_tags": self.storage.all_tags(),
            }
        )


class RecipeListView(_BaseView):
    """GET / POST /api/recipe_box/recipes."""

    url = "/api/recipe_box/recipes"
    name = "api:recipe_box:recipes"

    async def get(self, request: web.Request) -> web.Response:
        return self.json(
            [_summarize(s, r) for s, r in self.storage.list_all()]
        )

    async def post(self, request: web.Request) -> web.Response:
        """Save a reviewed recipe.

        Body: {
            recipe: <full recipe dict>,
            slug: <optional override>,
            on_conflict: "error" | "overwrite" | "new_copy" | "skip",
            hero_url: <optional override of recipe.image>,
        }
        """
        try:
            payload = await request.json()
        except ValueError:
            return self.json_message("Invalid JSON", 400)

        recipe = payload.get("recipe")
        if not recipe or not isinstance(recipe, dict):
            return self.json_message("Missing or invalid recipe", 400)

        slug_input = payload.get("slug") or recipe.get(META_NAMESPACE, {}).get(
            "suggested_slug"
        )
        if not slug_input:
            return self.json_message("Cannot determine slug", 400)
        slug = slugify(slug_input)

        on_conflict = payload.get("on_conflict", CONFLICT_ERROR)
        if on_conflict not in CONFLICT_OPTIONS:
            return self.json_message(
                f"Invalid on_conflict value (must be one of {CONFLICT_OPTIONS})",
                400,
            )

        hero_url = payload.get("hero_url") or recipe.get("image")
        hero_bytes: bytes | None = None
        if hero_url:
            hass: HomeAssistant = request.app["hass"]
            try:
                status, data = await _fetch_url(
                    hass, hero_url, binary=True, timeout=15
                )
                if status == 200 and isinstance(data, bytes):
                    hero_bytes = data
            except (aiohttp.ClientError, TimeoutError) as err:
                _LOGGER.warning(
                    "Hero image fetch failed (%s); saving without image", err
                )

        try:
            final_slug, saved = await self.storage.async_save(
                slug,
                recipe,
                on_conflict=on_conflict,
                hero_bytes=hero_bytes,
            )
        except RecipeConflictError as err:
            return self.json(
                {
                    "error": "conflict",
                    "slug": err.slug,
                    "existing": _summarize(err.slug, err.existing),
                },
                status_code=409,
            )

        return self.json(
            {"slug": final_slug, "recipe": saved}, status_code=201
        )


class RecipeDetailView(_BaseView):
    """GET / PUT / DELETE /api/recipe_box/recipes/{slug}."""

    url = "/api/recipe_box/recipes/{slug}"
    name = "api:recipe_box:recipe_detail"

    async def get(self, request: web.Request, slug: str) -> web.Response:
        recipe = self.storage.get(slug)
        if not recipe:
            return self.json_message("Not found", 404)
        return self.json(recipe)

    async def put(self, request: web.Request, slug: str) -> web.Response:
        """Update an existing recipe (used for editing tags/notes)."""
        if slug not in self.storage.recipes:
            return self.json_message("Not found", 404)
        try:
            payload = await request.json()
        except ValueError:
            return self.json_message("Invalid JSON", 400)
        recipe = payload.get("recipe")
        if not recipe:
            return self.json_message("Missing recipe", 400)

        # Edits always overwrite; user clicked save in the edit form
        from .const import CONFLICT_OVERWRITE

        final_slug, saved = await self.storage.async_save(
            slug, recipe, on_conflict=CONFLICT_OVERWRITE
        )
        return self.json({"slug": final_slug, "recipe": saved})

    async def delete(self, request: web.Request, slug: str) -> web.Response:
        deleted = await self.storage.async_delete(slug)
        if not deleted:
            return self.json_message("Not found", 404)
        return self.json_message("Deleted", 200)


class RecipeMarkCookedView(_BaseView):
    """POST /api/recipe_box/recipes/{slug}/cooked -> increment cooked_count."""

    url = "/api/recipe_box/recipes/{slug}/cooked"
    name = "api:recipe_box:recipe_cooked"

    async def post(self, request: web.Request, slug: str) -> web.Response:
        saved = await self.storage.async_mark_cooked(slug)
        if not saved:
            return self.json_message("Not found", 404)
        return self.json(saved)


class RecipeShoppingPreviewView(_BaseView):
    """POST /api/recipe_box/recipes/{slug}/shopping_preview.

    Body: { todo_entity: <todo.entity>, servings: <float|null> }

    Returns the scaled ingredient list with `already_on_list` flags so the
    card can render the dedup preview before committing.
    """

    url = "/api/recipe_box/recipes/{slug}/shopping_preview"
    name = "api:recipe_box:shopping_preview"

    async def post(self, request: web.Request, slug: str) -> web.Response:
        recipe = self.storage.get(slug)
        if not recipe:
            return self.json_message("Not found", 404)

        try:
            payload = await request.json()
        except ValueError:
            return self.json_message("Invalid JSON", 400)

        todo_entity = payload.get("todo_entity")
        if not todo_entity:
            return self.json_message("Missing todo_entity", 400)
        servings = payload.get("servings")
        compact = payload.get("compact", True)

        from .services import build_shopping_preview

        hass: HomeAssistant = request.app["hass"]
        preview = await build_shopping_preview(
            hass, recipe, todo_entity, servings, compact=bool(compact)
        )
        return self.json(preview)


# ---------------------------------------------------------------------------
# Document-backed recipes (PDFs, photos of printed recipes)
# ---------------------------------------------------------------------------


class RecipeUploadView(_BaseView):
    """POST /api/recipe_box/upload.

    Body: {
      name:          str,           # required
      file_b64:      str,           # required, base64-encoded file content
      file_type:     "pdf"|"image", # required
      filename:      str,           # original filename, used for extension
      tags:          [str],         # optional
      notes:         str,           # optional
      on_conflict:   str,           # optional, default "new_copy"
    }

    Creates a recipe shell (empty ingredients/instructions, schema.org
    Recipe shape) with the uploaded file stored alongside.
    """

    url = "/api/recipe_box/upload"
    name = "api:recipe_box:upload"

    async def post(self, request: web.Request) -> web.Response:
        try:
            payload = await request.json()
        except ValueError:
            return self.json_message("Invalid JSON", 400)

        name = (payload.get("name") or "").strip()
        file_b64 = payload.get("file_b64") or ""
        file_type = payload.get("file_type") or ""
        filename = payload.get("filename") or ""
        tags = payload.get("tags") or []
        notes = payload.get("notes") or ""
        on_conflict = payload.get("on_conflict", "new_copy")

        if not name:
            return self.json_message("Missing name", 400)
        if not file_b64:
            return self.json_message("Missing file_b64", 400)
        if file_type not in ("pdf", "image"):
            return self.json_message(
                "file_type must be 'pdf' or 'image'", 400
            )
        if on_conflict not in CONFLICT_OPTIONS:
            return self.json_message("Invalid on_conflict", 400)

        # Decode the file
        import base64

        try:
            file_bytes = base64.b64decode(file_b64, validate=True)
        except (ValueError, base64.binascii.Error) as err:
            return self.json_message(f"Invalid base64: {err}", 400)

        # Hard cap at 10MB to avoid surprises
        if len(file_bytes) > 10 * 1024 * 1024:
            return self.json_message(
                "File too large (>10MB). Compress or split.", 413
            )

        # Pick an attachment filename
        from datetime import datetime, timezone
        from urllib.parse import urlparse  # noqa: F401  (kept consistent with other views)

        ext = self._extension_for(filename, file_type)
        attachment_name = f"source{ext}"

        slug = slugify(name)

        # Build a minimal schema.org Recipe shell
        recipe: dict[str, Any] = {
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": name,
            "recipeIngredient": [],
            "recipeInstructions": [],
            META_NAMESPACE: {
                "source_url": "",
                "source_host": "",
                "source_type": file_type,  # "pdf" | "image"
                "source_file": attachment_name,
                "suggested_slug": slug,
                "tags": list(tags) if isinstance(tags, list) else [],
                "notes": notes,
                "last_cooked": None,
                "cooked_count": 0,
                "imported_at": datetime.now(timezone.utc).isoformat(),
                "schema_version": 1,
            },
        }

        # If the file is an image, also use it as the hero
        hero_bytes = file_bytes if file_type == "image" else None

        try:
            final_slug, saved = await self.storage.async_save(
                slug, recipe, on_conflict=on_conflict, hero_bytes=hero_bytes
            )
        except RecipeConflictError as err:
            return self.json(
                {
                    "error": "conflict",
                    "slug": err.slug,
                },
                status_code=409,
            )

        # Save the attachment file (after the folder exists from save above)
        try:
            await self.storage.async_save_attachment(
                final_slug, attachment_name, file_bytes
            )
        except (FileNotFoundError, OSError) as err:
            return self.json_message(f"Failed to save attachment: {err}", 500)

        return self.json({"slug": final_slug, "recipe": saved}, status_code=201)

    @staticmethod
    def _extension_for(filename: str, file_type: str) -> str:
        # Honor the user's filename extension if it's reasonable
        from pathlib import PurePath

        ext = PurePath(filename).suffix.lower()
        if file_type == "pdf":
            return ".pdf"
        # image
        if ext in (".jpg", ".jpeg", ".png", ".webp", ".heic", ".gif"):
            return ext
        return ".jpg"  # safe default


class RecipeAttachmentView(_BaseView):
    """GET /api/recipe_box/recipes/{slug}/attachment.

    Streams the source file (PDF or image). MIME type inferred from
    extension. 404 if the recipe has no attachment or the file is missing.
    """

    url = "/api/recipe_box/recipes/{slug}/attachment"
    name = "api:recipe_box:attachment"

    async def get(self, request: web.Request, slug: str) -> web.Response:
        recipe = self.storage.get(slug)
        if not recipe:
            return self.json_message("Not found", 404)

        meta = recipe.get(META_NAMESPACE) or {}
        attachment_name = meta.get("source_file")
        if not attachment_name:
            return self.json_message(
                "Recipe has no attachment", 404
            )

        path = self.storage.get_attachment_path(slug, attachment_name)
        if not path:
            return self.json_message("Attachment file missing", 404)

        # Stream the file
        import mimetypes

        ctype, _ = mimetypes.guess_type(str(path))
        if not ctype:
            ctype = (
                "application/pdf"
                if path.suffix.lower() == ".pdf"
                else "application/octet-stream"
            )

        # Read bytes via executor; files are small enough to load fully
        hass: HomeAssistant = request.app["hass"]
        data = await hass.async_add_executor_job(path.read_bytes)
        return web.Response(body=data, content_type=ctype)
