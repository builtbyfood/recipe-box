"""Service handlers for Recipe Box."""
from __future__ import annotations

import logging
import re
from typing import Any

import aiohttp
import async_timeout
import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    CONFLICT_ERROR,
    CONFLICT_OPTIONS,
    DOMAIN,
    META_NAMESPACE,
    SERVICE_ADD_FROM_URL,
    SERVICE_ADD_TO_LIST,
    SERVICE_DELETE,
    SERVICE_MARK_COOKED,
    SERVICE_REFRESH,
)
from .parser import (
    RecipeParseError,
    parse_recipe_html,
    parse_recipe_text,
    slugify,
)
from .storage import RecipeConflictError, RecipeStorage

_LOGGER = logging.getLogger(__name__)

# Browser-like headers — see http_api.py for rationale.
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

_ADD_FROM_URL_SCHEMA = vol.Schema(
    {
        vol.Optional("url", default=""): cv.string,
        vol.Optional("html"): cv.string,
        vol.Optional("text"): cv.string,
        vol.Optional("slug"): cv.string,
        vol.Optional("tags", default=list): vol.All(
            cv.ensure_list, [cv.string]
        ),
        vol.Optional("notes", default=""): cv.string,
        vol.Optional("on_conflict", default=CONFLICT_ERROR): vol.In(
            CONFLICT_OPTIONS
        ),
        vol.Optional("notify_target"): cv.string,
    }
)

_ADD_TO_LIST_SCHEMA = vol.Schema(
    {
        vol.Required("recipe_id"): cv.string,
        vol.Required("todo_entity"): cv.entity_id,
        vol.Optional("servings"): vol.Coerce(float),
        vol.Optional("skip_existing", default=True): cv.boolean,
        vol.Optional("compact", default=True): cv.boolean,
    }
)

_DELETE_SCHEMA = vol.Schema({vol.Required("recipe_id"): cv.string})
_MARK_COOKED_SCHEMA = vol.Schema({vol.Required("recipe_id"): cv.string})
_REFRESH_SCHEMA = vol.Schema({})


async def async_register_services(
    hass: HomeAssistant, storage: RecipeStorage
) -> None:
    """Register all Recipe Box services."""

    async def add_from_url(call: ServiceCall) -> dict[str, Any]:
        recipe_url = (call.data.get("url") or "").strip()
        provided_html = call.data.get("html")
        provided_text = call.data.get("text")

        # Three input paths:
        # 1. text provided  → parse as free text (mobile_app_share text path)
        # 2. html provided  → parse as HTML (bookmarklet path)
        # 3. else fetch URL → parse as HTML (default path)

        if provided_text:
            try:
                recipe = await hass.async_add_executor_job(
                    parse_recipe_text, provided_text, recipe_url or "shared"
                )
            except RecipeParseError as err:
                raise HomeAssistantError(str(err)) from err
        else:
            if not recipe_url:
                raise HomeAssistantError(
                    "Either 'url', 'html', or 'text' must be provided."
                )

            if provided_html:
                html = provided_html
            else:
                session = async_get_clientsession(hass)
                try:
                    async with async_timeout.timeout(20):
                        async with session.get(
                            recipe_url, headers=BROWSER_HEADERS
                        ) as resp:
                            if resp.status >= 400:
                                from urllib.parse import urlparse

                                host = urlparse(recipe_url).netloc
                                raise HomeAssistantError(
                                    f"{host} returned HTTP {resp.status}. "
                                    f"For Cloudflare-protected sites, share "
                                    f"the rendered page text instead via the "
                                    f"`text` param."
                                )
                            html = await resp.text()
                except (aiohttp.ClientError, TimeoutError) as err:
                    raise HomeAssistantError(
                        f"Failed to fetch URL: {err}"
                    ) from err

            try:
                recipe = await hass.async_add_executor_job(
                    parse_recipe_html, html, recipe_url
                )
            except RecipeParseError as err:
                raise HomeAssistantError(str(err)) from err

        slug = slugify(
            call.data.get("slug") or recipe[META_NAMESPACE]["suggested_slug"]
        )
        if call.data.get("tags"):
            recipe[META_NAMESPACE]["tags"] = call.data["tags"]
        if call.data.get("notes"):
            recipe[META_NAMESPACE]["notes"] = call.data["notes"]

        # Fetch hero image (uses server-side network — usually CDN-hosted
        # on a different domain from the recipe page, so bot-protection
        # rarely applies)
        hero_bytes = None
        hero_url = recipe.get("image")
        if hero_url:
            try:
                session = async_get_clientsession(hass)
                async with async_timeout.timeout(15):
                    async with session.get(
                        hero_url, headers=BROWSER_HEADERS
                    ) as resp:
                        if resp.status == 200:
                            hero_bytes = await resp.read()
            except (aiohttp.ClientError, TimeoutError) as err:
                _LOGGER.warning("Hero image fetch failed: %s", err)

        try:
            final_slug, saved = await storage.async_save(
                slug,
                recipe,
                on_conflict=call.data["on_conflict"],
                hero_bytes=hero_bytes,
            )
        except RecipeConflictError as err:
            raise HomeAssistantError(
                f"Recipe '{err.slug}' already exists. "
                f"Set on_conflict to 'overwrite', 'new_copy', or 'skip'."
            ) from err

        # Fire event so automations can react (notifications, dashboard pings)
        hass.bus.async_fire(
            f"{DOMAIN}_imported",
            {
                "slug": final_slug,
                "name": saved.get("name"),
                "source_url": recipe_url,
                "source_host": saved.get(META_NAMESPACE, {}).get("source_host"),
                "ingredient_count": len(saved.get("recipeIngredient", [])),
            },
        )

        # Optionally fire notify directly (skips needing an automation)
        notify_target = call.data.get("notify_target")
        if notify_target:
            try:
                # notify.<service> — strip the prefix
                if notify_target.startswith("notify."):
                    notify_target = notify_target[len("notify.") :]
                await hass.services.async_call(
                    "notify",
                    notify_target,
                    {
                        "title": "Recipe imported",
                        "message": f"\"{saved.get('name')}\" saved with "
                        f"{len(saved.get('recipeIngredient', []))} ingredients.",
                        "data": {
                            "url": "/recipes-mobile/recipes",
                            "clickAction": "/recipes-mobile/recipes",
                        },
                    },
                    blocking=False,
                )
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("notify call failed: %s", err)

        return {
            "slug": final_slug,
            "name": saved.get("name"),
            "ingredient_count": len(saved.get("recipeIngredient", [])),
        }

    async def add_to_list(call: ServiceCall) -> dict[str, Any]:
        recipe_id = call.data["recipe_id"]
        todo_entity = call.data["todo_entity"]
        servings = call.data.get("servings")
        skip_existing = call.data["skip_existing"]
        compact = call.data["compact"]

        recipe = storage.get(recipe_id)
        if not recipe:
            raise HomeAssistantError(f"Recipe '{recipe_id}' not found")

        preview = await build_shopping_preview(
            hass, recipe, todo_entity, servings, compact=compact
        )

        added: list[str] = []
        skipped: list[str] = []
        for item in preview["items"]:
            if skip_existing and item["already_on_list"]:
                skipped.append(item["text"])
                continue
            await hass.services.async_call(
                "todo",
                "add_item",
                {"entity_id": todo_entity, "item": item["text"]},
                blocking=True,
            )
            added.append(item["text"])

        return {"added": added, "skipped": skipped}

    async def delete_recipe(call: ServiceCall) -> dict[str, Any]:
        recipe_id = call.data["recipe_id"]
        deleted = await storage.async_delete(recipe_id)
        if not deleted:
            raise HomeAssistantError(f"Recipe '{recipe_id}' not found")
        return {"deleted": recipe_id}

    async def mark_cooked(call: ServiceCall) -> dict[str, Any]:
        recipe_id = call.data["recipe_id"]
        saved = await storage.async_mark_cooked(recipe_id)
        if not saved:
            raise HomeAssistantError(f"Recipe '{recipe_id}' not found")
        meta = saved.get(META_NAMESPACE) or {}
        return {
            "slug": recipe_id,
            "cooked_count": meta.get("cooked_count"),
            "last_cooked": meta.get("last_cooked"),
        }

    async def refresh(call: ServiceCall) -> dict[str, Any]:
        await storage.async_load()
        return {"loaded": len(storage.recipes)}

    hass.services.async_register(
        DOMAIN, SERVICE_ADD_FROM_URL, add_from_url,
        schema=_ADD_FROM_URL_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_ADD_TO_LIST, add_to_list,
        schema=_ADD_TO_LIST_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_DELETE, delete_recipe,
        schema=_DELETE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_MARK_COOKED, mark_cooked,
        schema=_MARK_COOKED_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, SERVICE_REFRESH, refresh,
        schema=_REFRESH_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )


# ---------------------------------------------------------------------------
# Shopping list helpers (also used by the HTTP API)
# ---------------------------------------------------------------------------


async def build_shopping_preview(
    hass: HomeAssistant,
    recipe: dict[str, Any],
    todo_entity: str,
    servings: float | None,
    compact: bool = True,
) -> dict[str, Any]:
    """Build the {items: [...], list_items: [...]} preview payload.

    Each ingredient is checked against the current todo list with
    fuzzy-matching so the card can show what's already there.

    If `compact=True` (default), each item's `text` is shortened to a
    shopping-list-friendly form: measurement units stripped, "1 X" reduced
    to "X", trailing prep words removed. Set False to send full ingredient
    lines with quantities.
    """
    raw_ingredients: list[str] = recipe.get("recipeIngredient", []) or []

    multiplier = 1.0
    base_yield = _parse_yield_count(recipe.get("recipeYield", ""))
    if servings is not None and base_yield:
        multiplier = float(servings) / base_yield

    scaled = (
        _scale_ingredients(raw_ingredients, multiplier)
        if multiplier != 1.0
        else list(raw_ingredients)
    )

    # Fetch current list items
    current_items: list[str] = []
    try:
        response = await hass.services.async_call(
            "todo",
            "get_items",
            {"entity_id": todo_entity},
            blocking=True,
            return_response=True,
        )
        if response and todo_entity in response:
            current_items = [
                item["summary"]
                for item in response[todo_entity].get("items", [])
                if item.get("status") != "completed"
            ]
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Could not fetch current items from %s: %s",
                        todo_entity, err)

    items = []
    for raw, scaled_line in zip(raw_ingredients, scaled):
        # `text` is what gets sent to the list; `original` is the recipe line
        text = compact_ingredient(scaled_line) if compact else scaled_line
        if not text.strip():
            # compact_ingredient returned empty (e.g., dropped entirely) —
            # skip; user can re-enable full mode if they want it back
            continue
        match = _fuzzy_match(text, current_items)
        items.append(
            {
                "text": text,
                "original": raw,
                "scaled": scaled_line,
                "already_on_list": match is not None,
                "matched_item": match,
            }
        )

    return {
        "items": items,
        "current_list_items": current_items,
        "multiplier": multiplier,
        "base_yield": base_yield,
        "todo_entity": todo_entity,
        "compact": compact,
    }


# ---------------------------------------------------------------------------
# Compact ingredient parsing — turn "2 1/4 cups all-purpose flour" into
# "all-purpose flour" for shopping-list use.
# ---------------------------------------------------------------------------

# Volume / weight measurements — when present, both qty AND unit are dropped.
_MEASUREMENT_UNITS = (
    r"cups?|tsp\.?|teaspoons?|tbsp\.?|tablespoons?|"
    r"oz\.?|ounces?|fl\.?\s*oz\.?|fluid\s*ounces?|"
    r"lbs?\.?|pounds?|"
    r"g(?:rams?)?|kg|kilograms?|"
    r"ml|milliliters?|l|liters?|litres?|"
    r"pints?|quarts?|gallons?|"
    r"sticks?|pinch(?:es)?|dash(?:es)?|"
    r"sprigs?|bunch(?:es)?|cloves?|heads?|stalks?"
)

# Container / count units — also stripped; "1 can chickpeas" -> "chickpeas".
_CONTAINER_UNITS = (
    r"cans?|jars?|packages?|pkg\.?|bags?|boxes?|bottles?|loaves?|"
    r"slices?|strips?|pieces?"
)

_UNITS = f"(?:{_MEASUREMENT_UNITS}|{_CONTAINER_UNITS})"

# Quantity patterns
_QTY_NUM = r"\d+(?:\.\d+)?(?:\s+\d+/\d+)?|\d+/\d+"
_QTY_OR_RANGE = rf"(?:{_QTY_NUM})(?:\s*(?:-|to|–|—|or)\s*(?:{_QTY_NUM}))?"

# Prep words to strip when they trail the ingredient (after a comma OR at end)
_PREP_PHRASE = (
    r"minced|chopped|diced|sliced|grated|melted|softened|"
    r"divided|to\s+taste|optional|peeled|crushed|cubed|halved|"
    r"shredded|toasted|drained|rinsed|trimmed|seeded|cored|stemmed|"
    r"finely\s+\w+|coarsely\s+\w+|thinly\s+\w+|roughly\s+\w+|"
    r"freshly\s+\w+|cut\s+into\s+[^,]+|for\s+\w+ing|"
    r"at\s+room\s+temperature|room\s+temperature|"
    r"plus\s+more\s+for\s+\w+"
)


def compact_ingredient(raw: str) -> str:
    """Convert a raw ingredient line into a shopping-list-friendly form.

    Examples (input -> output):
        "2 1/4 cups all-purpose flour"        -> "all-purpose flour"
        "1 tsp salt"                          -> "salt"
        "1/2 cup butter, melted"              -> "butter"
        "1 lb ground beef"                    -> "ground beef"
        "2 large eggs"                        -> "2 large eggs"
        "3 tomatoes, diced"                   -> "3 tomatoes"
        "1 onion, chopped"                    -> "onion"
        "2-3 cloves garlic, minced"           -> "garlic"
        "1 (15 oz) can chickpeas, drained"    -> "chickpeas"
        "Salt and pepper to taste"            -> "salt and pepper"

    Falls back to the original line if it can't be parsed.
    """
    if not raw or not raw.strip():
        return ""

    s = raw.strip()

    # Strip parenthetical groups: "1 (15 oz) can chickpeas" -> "1  can chickpeas"
    s = re.sub(r"\s*\([^)]*\)\s*", " ", s)

    # Strip trailing prep clauses, both comma-prefixed and bare at end
    # First pass: ", chopped" / ", to taste"
    s = re.sub(
        rf",\s*\b(?:{_PREP_PHRASE})\b.*$",
        "",
        s,
        flags=re.IGNORECASE,
    )
    # Second pass: trailing " to taste" / " divided" without comma
    s = re.sub(
        rf"\s+\b(?:to\s+taste|divided|optional)\b\.?$",
        "",
        s,
        flags=re.IGNORECASE,
    )

    s = re.sub(r"\s+", " ", s).strip().rstrip(",.")

    # Try: <qty> <unit> <noun>
    m = re.match(
        rf"^({_QTY_OR_RANGE})\s+({_UNITS})\b\.?\s+(.+)$",
        s,
        re.IGNORECASE,
    )
    if m:
        return m.group(3).strip().rstrip(",")

    # Try: <qty> <noun>  (countable, no unit)
    m = re.match(rf"^({_QTY_OR_RANGE})\s+(.+)$", s)
    if m:
        qty_str = m.group(1).strip()
        noun = m.group(2).strip().rstrip(",")
        # Drop "1" prefix; keep ranges and counts > 1
        if qty_str == "1":
            return noun
        return f"{qty_str} {noun}"

    # No leading quantity (e.g. "Salt and pepper") — just clean and lowercase
    return s.lower().strip()


def _parse_yield_count(yield_str: str) -> float | None:
    """Pull a number out of recipeYield, e.g. '24 cookies' -> 24."""
    if not yield_str:
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", str(yield_str))
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


_QTY_PATTERN = re.compile(
    r"^\s*("
    r"(?:\d+(?:\.\d+)?)"           # 1, 1.5
    r"(?:\s+\d+/\d+)?"             # 1 1/2
    r"|\d+/\d+"                    # 1/2
    r")\s+(.+)$"
)


def _scale_ingredients(
    ingredients: list[str], multiplier: float
) -> list[str]:
    """Best-effort scale of ingredient quantities by multiplier.

    Falls back to the original line if quantity can't be parsed (e.g.
    'salt to taste' or '2-3 cloves garlic').
    """
    out: list[str] = []
    for ing in ingredients:
        m = _QTY_PATTERN.match(ing)
        if not m:
            out.append(ing)
            continue
        qty_str, rest = m.groups()
        try:
            qty = _parse_quantity(qty_str)
        except (ValueError, ZeroDivisionError):
            out.append(ing)
            continue
        out.append(f"{_format_qty(qty * multiplier)} {rest}")
    return out


def _parse_quantity(qty_str: str) -> float:
    """Parse '1', '1.5', '1/2', or '1 1/2' into a float."""
    qty_str = qty_str.strip()
    total = 0.0
    for part in qty_str.split():
        if "/" in part:
            num, den = part.split("/")
            total += float(num) / float(den)
        else:
            total += float(part)
    return total


def _format_qty(n: float) -> str:
    """Format a number as a clean string. Whole numbers stay whole."""
    if n == int(n):
        return str(int(n))
    return f"{n:.2f}".rstrip("0").rstrip(".")


def _fuzzy_match(needle: str, haystack: list[str]) -> str | None:
    """Return the matching item from haystack, or None."""
    if not haystack:
        return None
    try:
        from rapidfuzz import fuzz
    except ImportError:
        # Fallback: case-insensitive substring match on a normalized name
        needle_l = _normalize_for_match(needle)
        for hay in haystack:
            if needle_l in _normalize_for_match(hay):
                return hay
        return None

    needle_norm = _normalize_for_match(needle)
    for hay in haystack:
        hay_norm = _normalize_for_match(hay)
        score = fuzz.partial_ratio(needle_norm, hay_norm)
        if score >= 85:
            return hay
    return None


_QTY_PREFIX = re.compile(
    r"^\s*"
    # Quantity: integer, decimal, mixed number "1 1/2", or bare fraction "1/2"
    r"(?:\d+(?:\.\d+)?(?:\s+\d+/\d+)?|\d+/\d+)"
    r"(?:\s*-\s*\d+(?:/\d+)?)?"   # optional range "2-3"
    r"\s+"
    # Optional unit and/or size adjective
    r"(?:"
    r"cup|cups|tsp|tbsp|teaspoon|teaspoons|tablespoon|tablespoons|"
    r"oz|ounce|ounces|lb|lbs|pound|pounds|"
    r"g|kg|gram|grams|ml|l|liter|liters|"
    r"clove|cloves|pinch|dash|stick|sticks|sprig|sprigs|"
    r"can|cans|jar|jars|package|packages|pkg|"
    r"large|medium|small|whole|fresh"
    r")\.?\s+",
    re.IGNORECASE,
)


def _normalize_for_match(text: str) -> str:
    """Strip quantities/units/prep notes for fuzzy comparison.

    "1/2 cup butter, melted" -> "butter"
    "2-3 cloves garlic, minced" -> "garlic"
    "1 gallon milk" -> "milk" (gallon isn't in our unit list, so the qty
        alone is stripped via the fallback below)
    """
    s = text.lower().strip()
    # First pass: try the strict qty+unit pattern
    new_s = _QTY_PREFIX.sub("", s)
    if new_s == s:
        # Fallback: strip leading qty + any single word (catches odd units
        # like "gallon", "package of", etc.)
        new_s = re.sub(
            r"^\s*(?:\d+(?:\.\d+)?(?:\s+\d+/\d+)?|\d+/\d+)"
            r"(?:\s*-\s*\d+(?:/\d+)?)?\s+\S+\s+",
            "",
            s,
        )
    s = new_s
    # Drop common trailing prep words after a comma
    s = re.sub(
        r",?\s*(minced|chopped|diced|sliced|grated|melted|softened|"
        r"divided|to taste|optional|peeled|crushed|cubed|halved|"
        r"shredded|toasted|drained|rinsed|trimmed|seeded)\b.*$",
        "",
        s,
    )
    return s.strip()
