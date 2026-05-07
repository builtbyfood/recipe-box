# Recipe Box JSON Schema

Each recipe lives in its own folder under your `recipes_path`:

```
<recipes_path>/
  chocolate-chip-cookies/
    recipe.json     # required, schema.org Recipe + _recipebox metadata
    hero.jpg        # optional, downloaded from recipe.image
    notes.md        # optional, free-form (you write this yourself)
  sourdough-loaf/
    recipe.json
    hero.jpg
```

The folder name is the **slug** — URL-safe, the integration's primary key.

## File format

`recipe.json` is **valid schema.org Recipe JSON-LD** plus a single
underscore-namespaced extension `_recipebox` for our metadata. This means
any other tool that understands schema.org Recipe (Mealie, Tandoor,
Paprika, Google's recipe rich-result parsers) can read these files with
zero translation, and our metadata stays out of their way.

## Example

```json
{
  "@context": "https://schema.org",
  "@type": "Recipe",
  "name": "Chocolate Chip Cookies",
  "description": "Classic chewy chocolate chip cookies.",
  "image": "https://example.com/cookies.jpg",
  "author": "Sally Smith",
  "prepTime": "PT15M",
  "cookTime": "PT12M",
  "totalTime": "PT27M",
  "recipeYield": "24 cookies",
  "recipeCategory": "Dessert",
  "recipeCuisine": "American",
  "recipeIngredient": [
    "2 1/4 cups all-purpose flour",
    "1 tsp baking soda",
    "1 tsp salt",
    "1 cup butter, softened",
    "3/4 cup granulated sugar",
    "3/4 cup packed brown sugar",
    "2 large eggs",
    "2 tsp vanilla extract",
    "2 cups chocolate chips"
  ],
  "recipeInstructions": [
    {"@type": "HowToStep", "text": "Preheat oven to 375°F."},
    {"@type": "HowToStep", "text": "Cream butter and sugars until fluffy."},
    {"@type": "HowToStep", "text": "Beat in eggs and vanilla."},
    {"@type": "HowToStep", "text": "Mix in dry ingredients, fold in chocolate chips."},
    {"@type": "HowToStep", "text": "Drop spoonfuls onto ungreased baking sheet."},
    {"@type": "HowToStep", "text": "Bake 9-11 minutes until golden brown."}
  ],
  "nutrition": {
    "@type": "NutritionInformation",
    "calories": "180 kcal"
  },
  "_recipebox": {
    "source_url": "https://example.com/recipes/cookies",
    "source_host": "example.com",
    "suggested_slug": "chocolate-chip-cookies",
    "tags": ["dessert", "weeknight", "kid-favorite"],
    "notes": "Used half the salt, was great. Add an extra 5min for crispier.",
    "last_cooked": "2026-04-12T19:30:00+00:00",
    "cooked_count": 5,
    "imported_at": "2026-04-01T14:22:00+00:00",
    "schema_version": 1
  }
}
```

## Field reference

### schema.org fields (the recipe content)

| Field | Type | Notes |
|---|---|---|
| `@context` | string | Always `"https://schema.org"`. |
| `@type` | string | Always `"Recipe"`. |
| `name` | string | Recipe title. |
| `description` | string \| null | Recipe blurb/summary. |
| `image` | string \| null | URL of hero image. Cached locally as `hero.jpg`. |
| `author` | string \| null | Author name. |
| `prepTime` | string \| null | ISO 8601 duration, e.g. `PT15M`. |
| `cookTime` | string \| null | ISO 8601 duration. |
| `totalTime` | string \| null | ISO 8601 duration. |
| `recipeYield` | string | Yield text, e.g. `"24 cookies"` or `"4 servings"`. |
| `recipeCategory` | string \| null | Category like `"Dessert"`. |
| `recipeCuisine` | string \| null | Cuisine like `"Italian"`. |
| `recipeIngredient` | string[] | Ingredient lines as written. |
| `recipeInstructions` | object[] | List of `{@type: HowToStep, text: ...}`. |
| `nutrition` | object \| null | `NutritionInformation` if available. |

### `_recipebox` fields (our metadata)

| Field | Type | Notes |
|---|---|---|
| `source_url` | string | Original URL. Used for dedup. Empty string for file-uploaded recipes. |
| `source_host` | string | Hostname for display ("from nytimes.com"). Empty for file uploads. |
| `source_type` | string | `"web"` (default), `"pdf"`, or `"image"`. Drives rendering in the detail view. |
| `source_file` | string \| null | Filename of an attached document (e.g. `"source.pdf"`), if any. |
| `suggested_slug` | string | Auto-generated slug suggestion at import time. |
| `tags` | string[] | User-curated tags. |
| `notes` | string | Free-form notes (also see `notes.md`). |
| `last_cooked` | string \| null | ISO 8601 timestamp. |
| `cooked_count` | int | Times marked cooked. |
| `imported_at` | string | ISO 8601 timestamp. Stamped on first save. |
| `schema_version` | int | Bumped if this schema changes. |

## Document-backed recipes

A recipe can also be a PDF or photo of a printed recipe. The folder
structure stays the same — the document is just an extra file:

```
grandmas-meatloaf/
  recipe.json     # name + tags + notes; recipeIngredient/Instructions may be empty
  source.jpg      # the photo of the printed page (or source.pdf)
  hero.jpg        # cached thumbnail for the library tile (image source only)
```

The detail view detects `_recipebox.source_type` and renders an inline
viewer (image or PDF embed) instead of the schema.org content. You can
still transcribe ingredients/instructions later via the Edit button if
you want them searchable — they'll appear alongside the document.

## Why this format?

- **Future-proof.** Any tool that imports schema.org Recipe — and most do —
  can read these files. If you stand up Mealie tomorrow, point it at this
  folder. No exporter, no migration.
- **Diffable.** Each recipe is its own file. Track them in git if you want.
- **Hand-editable.** You can `vim recipe.json` to fix a typo. The
  filesystem watcher notices and reloads.
- **No DB.** Move the folder, change the path, no schema migration. The
  in-memory cache is rebuilt from disk on every load.
