"""Recipe parser.

Uses `recipe-scrapers` which handles schema.org Recipe JSON-LD (embedded by
~95% of recipe sites for Google rich results) and 400+ site-specific scrapers
for stubborn ones. Output is normalized to schema.org Recipe shape with our
underscore-namespaced metadata at `_recipebox`.
"""
from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urlparse

from .const import META_NAMESPACE, SCHEMA_VERSION

_LOGGER = logging.getLogger(__name__)

# Strip any character that isn't word-safe; collapse whitespace/dashes.
_SLUG_STRIP = re.compile(r"[^\w\s-]")
_SLUG_COLLAPSE = re.compile(r"[\s_-]+")


class RecipeParseError(Exception):
    """Raised when a recipe URL cannot be parsed."""


def slugify(text: str) -> str:
    """Generate a URL-safe slug from arbitrary text."""
    if not text:
        return "recipe"
    s = text.lower().strip()
    s = _SLUG_STRIP.sub("", s)
    s = _SLUG_COLLAPSE.sub("-", s)
    s = s.strip("-")
    return s or "recipe"


def parse_recipe_html(html: str, url: str) -> dict[str, Any]:
    """Parse fetched HTML into a schema.org Recipe-shaped dict.

    This is sync and CPU-bound; call it via `hass.async_add_executor_job`.
    """
    if not html:
        raise RecipeParseError("Empty HTML")

    parsed_url = urlparse(url)
    if parsed_url.scheme not in ("http", "https"):
        raise RecipeParseError(f"Invalid URL scheme: {parsed_url.scheme}")

    # Defer import so module loads even if recipe-scrapers isn't installed yet
    try:
        from recipe_scrapers import scrape_html
    except ImportError as err:
        raise RecipeParseError(
            "recipe-scrapers is not installed. Restart Home Assistant to install."
        ) from err

    # wild_mode=True lets us fall back to schema.org parsing on any site,
    # not just those with a hand-written scraper. supported_only is mutually
    # exclusive with wild_mode in recipe-scrapers >=15.
    scraper = None
    scraper_err: Exception | None = None
    try:
        scraper = scrape_html(html=html, org_url=url, wild_mode=True)
    except Exception as err:  # noqa: BLE001 - recipe-scrapers raises many types
        scraper_err = err

    # If scrape_html worked, peek at what it found. If the result is
    # empty (no ingredients) — common for older blogs without JSON-LD —
    # also fall through to the text fallback.
    scraper_useful = False
    if scraper is not None:
        try:
            ings = scraper.ingredients() or []
            scraper_useful = len(ings) >= 2
        except Exception:  # noqa: BLE001
            scraper_useful = False

    if not scraper_useful:
        # Fallback: strip the HTML to readable text and run the text
        # parser. Catches sites without schema.org markup that still
        # have a clearly-formatted recipe block in the page body.
        fallback = _try_html_text_fallback(html, url)
        if fallback is not None:
            return fallback
        # If even the text fallback failed, surface a useful error
        if scraper_err is not None:
            raise RecipeParseError(
                f"Couldn't parse {url}. recipe-scrapers said: {scraper_err}. "
                f"Try the 'Paste text' tab — copy the rendered recipe content "
                f"from your browser and paste it directly."
            ) from scraper_err
        raise RecipeParseError(
            f"Couldn't extract a recipe from {url}. The page may not have "
            f"structured recipe markup. Try the 'Paste text' tab — copy "
            f"the rendered recipe content and paste it directly."
        )

    def safe(fn, default=None):
        try:
            return fn()
        except Exception:  # noqa: BLE001
            return default

    title = safe(scraper.title) or "Untitled Recipe"

    recipe: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": title,
        "description": safe(scraper.description) or None,
        "image": _normalize_image(safe(scraper.image)),
        "author": _normalize_author(safe(scraper.author)),
        "datePublished": None,
        "prepTime": _to_iso8601_duration(safe(scraper.prep_time)),
        "cookTime": _to_iso8601_duration(safe(scraper.cook_time)),
        "totalTime": _to_iso8601_duration(safe(scraper.total_time)),
        "recipeYield": _normalize_yield(safe(scraper.yields)),
        "recipeCategory": safe(scraper.category) or None,
        "recipeCuisine": safe(scraper.cuisine) or None,
        "recipeIngredient": _clean_ingredients(
            safe(scraper.ingredients) or []
        ),
        "recipeInstructions": _format_instructions(
            safe(scraper.instructions_list) or safe(scraper.instructions) or []
        ),
        "nutrition": _format_nutrition(safe(scraper.nutrients) or {}),
        META_NAMESPACE: {
            "source_url": url,
            "source_host": parsed_url.netloc,
            "suggested_slug": slugify(title),
            "tags": [],
            "notes": "",
            "last_cooked": None,
            "cooked_count": 0,
            "imported_at": None,  # storage layer stamps this on save
            "schema_version": SCHEMA_VERSION,
        },
    }

    # Drop None values from top level for cleaner JSON
    return {k: v for k, v in recipe.items() if v is not None}


# ---------------------------------------------------------------------------
# Normalization helpers
# ---------------------------------------------------------------------------


def _to_iso8601_duration(minutes: Any) -> str | None:
    """Convert minutes (int/float/str) to ISO 8601 duration like 'PT25M'."""
    if not minutes:
        return None
    try:
        m = int(float(minutes))
    except (TypeError, ValueError):
        return None
    if m <= 0:
        return None
    if m >= 60:
        hours, mins = divmod(m, 60)
        if mins:
            return f"PT{hours}H{mins}M"
        return f"PT{hours}H"
    return f"PT{m}M"


def _normalize_image(image: Any) -> str | None:
    if not image:
        return None
    if isinstance(image, str):
        return image
    if isinstance(image, list) and image:
        return image[0] if isinstance(image[0], str) else None
    if isinstance(image, dict) and "url" in image:
        return image["url"]
    return None


def _normalize_author(author: Any) -> str | None:
    if not author:
        return None
    if isinstance(author, str):
        return author.strip()
    if isinstance(author, dict):
        return author.get("name")
    if isinstance(author, list) and author:
        first = author[0]
        return first if isinstance(first, str) else first.get("name")
    return None


def _normalize_yield(yield_val: Any) -> str:
    if not yield_val:
        return ""
    return str(yield_val).strip()


def _clean_ingredients(ingredients: list[Any]) -> list[str]:
    cleaned = []
    for ing in ingredients:
        s = str(ing).strip()
        if s:
            cleaned.append(s)
    return cleaned


def _format_instructions(instructions: Any) -> list[dict[str, str]]:
    """Convert recipe-scrapers instructions to schema.org HowToStep list."""
    if isinstance(instructions, str):
        steps = [s.strip() for s in instructions.split("\n") if s.strip()]
    elif isinstance(instructions, list):
        steps = [str(s).strip() for s in instructions if str(s).strip()]
    else:
        steps = []
    return [{"@type": "HowToStep", "text": step} for step in steps]


def _format_nutrition(nutrients: Any) -> dict[str, Any] | None:
    if not nutrients or not isinstance(nutrients, dict):
        return None
    result: dict[str, Any] = {"@type": "NutritionInformation"}
    for k, v in nutrients.items():
        if v not in (None, "", []):
            result[k] = v
    return result if len(result) > 1 else None


# ---------------------------------------------------------------------------
# Free-text recipe parser — heuristic, for paste-from-page content.
# ---------------------------------------------------------------------------

# Section header markers (case-insensitive). The first capture group is
# the matched header word so we can identify which section starts there.
_SECTION_INGREDIENTS = re.compile(
    r"^\s*(?:ingredients?|"
    r"you(?:'|\u2019)?ll\s+need|"
    r"what\s+you(?:'|\u2019)?ll\s+need|"
    r"shopping\s+list)\s*:?\s*$",
    re.IGNORECASE,
)
_SECTION_INSTRUCTIONS = re.compile(
    r"^\s*(?:instructions?|directions?|method|steps?|preparation|"
    r"how\s+to\s+make|to\s+make|to\s+prepare)\s*:?\s*$",
    re.IGNORECASE,
)
_SECTION_NOTES = re.compile(
    r"^\s*(?:notes?|tips?|chef(?:'|\u2019)?s?\s+notes?|cook(?:'|\u2019)?s?\s+tips?)\s*:?\s*$",
    re.IGNORECASE,
)
# Lines we should always skip (fluff, ad markers, copyright)
_SKIP_PATTERNS = (
    re.compile(r"^\s*(?:advertisement|sponsored|continue\s+reading)\s*$", re.IGNORECASE),
    re.compile(r"^\s*(?:©|copyright)", re.IGNORECASE),
    re.compile(r"^\s*share\s+this\s+recipe", re.IGNORECASE),
    re.compile(r"^\s*save\s+(?:to|recipe)", re.IGNORECASE),
    re.compile(r"^\s*print\s+recipe", re.IGNORECASE),
    re.compile(r"^\s*pin\s+(?:it|recipe)", re.IGNORECASE),
    re.compile(r"^\s*\d+\s+(?:reviews?|ratings?|comments?)\s*$", re.IGNORECASE),
)
# Yield/servings detection
_YIELD_PATTERNS = (
    re.compile(r"\b(?:yield|yields?|makes|serves)\s*:?\s*(\d+(?:\s*[-\u2013to]\s*\d+)?(?:\s+\w+)?)", re.IGNORECASE),
    re.compile(r"(\d+(?:\s*[-\u2013]\s*\d+)?)\s+servings?\b", re.IGNORECASE),
    re.compile(r"\bservings?\s*:?\s*(\d+(?:\s*[-\u2013]\s*\d+)?)", re.IGNORECASE),
)
# Time detection — produce minutes total
_TIME_PATTERNS = {
    "prepTime": re.compile(
        r"\bprep(?:aration)?(?:\s+time)?\s*:?\s*([^\n]+)", re.IGNORECASE
    ),
    "cookTime": re.compile(
        r"\bcook(?:ing)?(?:\s+time)?\s*:?\s*([^\n]+)", re.IGNORECASE
    ),
    "totalTime": re.compile(
        r"\btotal(?:\s+time)?\s*:?\s*([^\n]+)", re.IGNORECASE
    ),
}


def _parse_time_string(s: str) -> int | None:
    """Parse "1 hour 30 minutes" / "25 mins" / "1h 30m" into total minutes."""
    if not s:
        return None
    s = s.strip().lower()
    total = 0
    matched = False
    h = re.search(r"(\d+)\s*(?:h(?:our)?s?\b|hr\b)", s)
    if h:
        total += int(h.group(1)) * 60
        matched = True
    m = re.search(r"(\d+)\s*(?:m(?:in)?(?:ute)?s?\b)", s)
    if m:
        total += int(m.group(1))
        matched = True
    if not matched:
        # Just a bare number — assume minutes
        bare = re.search(r"^(\d+)$", s)
        if bare:
            total = int(bare.group(1))
            matched = True
    return total if matched else None


# Detector for ingredient-like lines: "1 cup flour", "1/4 cup oil",
# "1 1/2 tsp salt", "2 large eggs", "3 tomatoes". Used when no
# explicit "Ingredients" header is present in the source.
_INGREDIENT_LINE_PATTERN = re.compile(
    r"^\s*(?:"
    r"\d+(?:\.\d+)?(?:\s+\d+/\d+)?"   # 1, 1.5, 1 1/2
    r"|\d+/\d+"                        # 1/4
    r")"
    r"\s+\S",                          # ... followed by a word
)


def _looks_like_ingredient(line: str) -> bool:
    """Heuristic: does this line look like an ingredient entry?"""
    return bool(_INGREDIENT_LINE_PATTERN.match(line))


def _try_html_text_fallback(html: str, url: str) -> dict[str, Any] | None:
    """When recipe-scrapers fails or finds nothing, strip the HTML to
    readable text and run the free-text parser on it.

    Returns a parsed recipe dict on success, or None if even the text
    parser couldn't make sense of it (caller decides what error to raise).
    """
    try:
        from bs4 import BeautifulSoup  # type: ignore[import-untyped]
    except ImportError:
        return None

    try:
        soup = BeautifulSoup(html, "html.parser")
    except Exception:  # noqa: BLE001
        return None

    # Drop chrome that's almost certainly not recipe content
    for tag in soup(
        ["nav", "script", "style", "aside", "footer", "header",
         "noscript", "iframe", "form", "button"]
    ):
        tag.decompose()

    # Find the most content-rich element to focus on. Sites often
    # wrap recipe content in an <article>, <main>, or .entry-content
    # div — try those first, then fall back to <body>.
    content = (
        soup.find("article")
        or soup.find("main")
        or soup.select_one(".entry-content, .post-content, .recipe-content")
        or soup.body
        or soup
    )

    raw_text = content.get_text(separator="\n")

    # Compress runs of whitespace, keep paragraph breaks
    text = re.sub(r"[ \t]+", " ", raw_text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)

    # Pull a title from the page if available
    title_tag = soup.find("h1") or soup.find("title")
    if title_tag and title_tag.get_text(strip=True):
        # Prepend the title so the text parser picks it up reliably
        title_text = title_tag.get_text(strip=True)
        text = f"{title_text}\n\n{text}"

    try:
        recipe = parse_recipe_text(text, url)
    except RecipeParseError:
        return None

    # Improve the metadata since we have URL context
    parsed_url = urlparse(url)
    meta = recipe.get(META_NAMESPACE, {})
    meta["source_url"] = url
    meta["source_host"] = parsed_url.netloc
    recipe[META_NAMESPACE] = meta

    # Try to grab the og:image as a hero, since the text parser won't
    og_image = soup.find("meta", attrs={"property": "og:image"})
    if og_image and og_image.get("content"):
        recipe["image"] = og_image["content"]

    return recipe


def parse_recipe_text(text: str, source_label: str = "") -> dict[str, Any]:
    """Parse free-text recipe content into a schema.org Recipe shape.

    Best-effort heuristic. Splits on common section headers (Ingredients,
    Directions, etc.), extracts title from the first non-empty line above
    the first section, and pulls yield/time from anywhere in the doc.

    Raises RecipeParseError if no ingredients section is found.
    """
    if not text or not text.strip():
        raise RecipeParseError("Empty text")

    # Normalize line endings + tabs, but keep blank lines as separators
    lines = [
        re.sub(r"[ \t]+", " ", l).rstrip()
        for l in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    ]
    # Drop skip-patterns
    lines = [
        l for l in lines
        if not any(p.match(l) for p in _SKIP_PATTERNS)
    ]

    # Pass 1: find section boundaries
    boundaries: list[tuple[int, str]] = []
    for i, l in enumerate(lines):
        if _SECTION_INGREDIENTS.match(l):
            boundaries.append((i, "ingredients"))
        elif _SECTION_INSTRUCTIONS.match(l):
            boundaries.append((i, "instructions"))
        elif _SECTION_NOTES.match(l):
            boundaries.append((i, "notes"))

    has_ing_header = any(k == "ingredients" for _, k in boundaries)
    instr_idx = next(
        (i for i, k in boundaries if k == "instructions"), None
    )

    # If we have Directions/Instructions but no Ingredients header,
    # try to infer the ingredients block: lines before the Instructions
    # header that look like ingredient entries (start with a quantity).
    if not has_ing_header and instr_idx is not None:
        ingredient_candidates = [
            i for i in range(instr_idx)
            if _looks_like_ingredient(lines[i])
        ]
        if len(ingredient_candidates) >= 2:
            # Inject a virtual "Ingredients" header before the first
            # ingredient-looking line. We modify `lines` and `boundaries`
            # in place.
            inject_at = ingredient_candidates[0]
            lines.insert(inject_at, "Ingredients")
            # Boundary indices >= inject_at have shifted by 1
            boundaries = [
                (idx + 1 if idx >= inject_at else idx, kind)
                for idx, kind in boundaries
            ]
            boundaries.insert(0, (inject_at, "ingredients"))
            has_ing_header = True

    if not has_ing_header:
        raise RecipeParseError(
            "Couldn't find an Ingredients section. The parser looks for "
            "a header like 'Ingredients' or 'You'll Need', or a list of "
            "lines starting with a quantity (like '1 cup flour') above "
            "a 'Directions' or 'Instructions' header."
        )

    # Pass 2: extract chunks per section
    sections: dict[str, list[str]] = {"header": [], "ingredients": [], "instructions": [], "notes": []}
    cur_section = "header"
    skip_next_header = -1
    for i, l in enumerate(lines):
        if i == skip_next_header:
            continue
        match_kind = next((kind for idx, kind in boundaries if idx == i), None)
        if match_kind:
            cur_section = match_kind
            continue
        sections[cur_section].append(l)

    # Title: first non-empty line in the header chunk (or before first
    # section if header is empty)
    title = ""
    for l in sections["header"]:
        l = l.strip()
        if l and len(l) < 200:
            title = l
            break
    if not title:
        title = "Untitled Recipe"

    # Ingredients: each non-empty line is one item; strip leading bullets
    ingredients = []
    for l in sections["ingredients"]:
        l = l.strip()
        if not l:
            continue
        # Strip leading bullet/number prefixes
        l = re.sub(r"^[\u2022\u25e6\u2023\u2043\-\*\u00b7]\s*", "", l)
        l = re.sub(r"^\d+[\.)]\s+", "", l)
        if l:
            ingredients.append(l)

    # Instructions: same approach, each non-empty line is one step.
    # Skip lines that are obviously metadata rather than cooking steps —
    # Yield:, Servings:, Nutrition info, prep/cook/total time labels.
    instructions = []
    metadata_line = re.compile(
        r"^\s*(?:yield|yields|serves|serving|servings|makes|"
        r"prep(?:aration)?(?:\s+time)?|cook(?:ing)?(?:\s+time)?|"
        r"total(?:\s+time)?|"
        r"nutrition(?:\s+information)?|"
        r"calories|carb|fat|protein)\s*:",
        re.IGNORECASE,
    )
    for l in sections["instructions"]:
        l = l.strip()
        if not l:
            continue
        if metadata_line.match(l):
            continue
        l = re.sub(r"^[\u2022\u25e6\u2023\u2043\-\*\u00b7]\s*", "", l)
        l = re.sub(r"^(?:step\s+)?\d+[\.)]?\s+", "", l, flags=re.IGNORECASE)
        if l:
            instructions.append(l)

    # Notes
    notes_text = "\n".join(l.strip() for l in sections["notes"] if l.strip()).strip()

    # Yield/time detection — search the whole text
    full_text = "\n".join(lines)
    recipe_yield = ""
    for pat in _YIELD_PATTERNS:
        m = pat.search(full_text)
        if m:
            recipe_yield = m.group(1).strip()
            break

    def find_time(name: str) -> str | None:
        m = _TIME_PATTERNS[name].search(full_text)
        if not m:
            return None
        mins = _parse_time_string(m.group(1))
        if mins is None:
            return None
        if mins >= 60:
            hours, rem = divmod(mins, 60)
            return f"PT{hours}H{rem}M" if rem else f"PT{hours}H"
        return f"PT{mins}M"

    recipe: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": title,
        "recipeYield": recipe_yield,
        "recipeIngredient": ingredients,
        "recipeInstructions": [
            {"@type": "HowToStep", "text": s} for s in instructions
        ],
        META_NAMESPACE: {
            "source_url": "",
            "source_host": source_label or "pasted",
            "source_type": "web",
            "source_file": None,
            "suggested_slug": slugify(title),
            "tags": [],
            "notes": notes_text,
            "last_cooked": None,
            "cooked_count": 0,
            "imported_at": None,
            "schema_version": SCHEMA_VERSION,
        },
    }
    for time_field in ("prepTime", "cookTime", "totalTime"):
        val = find_time(time_field)
        if val:
            recipe[time_field] = val

    if not ingredients:
        raise RecipeParseError(
            "No ingredients found between 'Ingredients' and 'Instructions' "
            "sections. Check the paste."
        )

    return {k: v for k, v in recipe.items() if v not in (None, "")}
