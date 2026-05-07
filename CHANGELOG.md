# Changelog

All notable changes to this project are documented here.

## [0.3.0] — 2026-05-07

First public release. Combines the integration and card into a
single monorepo.

### Integration

- Free-text recipe parsing — handles paste from any rendered recipe
  page, useful for Cloudflare-protected sites
- PDF and image upload — store the document alongside the recipe,
  served via attachment endpoint
- `_recipebox.source_type` and `source_file` fields for
  document-backed recipes (web / pdf / image)
- `compact` parameter on `add_to_list` and shopping_preview — strips
  measurement units to send shopping-list-friendly item names
- `recipeCategory` and `ingredients_text` in the library summary
- Smart ingredient inference: when a page has a `Directions` header
  but no `Ingredients` header, the parser infers the ingredient
  block from quantity-prefixed lines above
- Conflict resolution via `on_conflict` — error / overwrite / new_copy / skip
- Support for `text` parameter in `add_from_url` for share-event use

### Card

- **Library organization**: sort dropdown (5 modes), grid/list view
  toggle, four quick-filter chips (Never tried, Quick, Cooked
  recently, Favorites), search across recipe names AND ingredient
  text
- **Cook again carousel**: horizontal-scrolling row of most-cooked
  recipes at the top of the library
- **Random picker**: 🎲 picks a recipe at random, respecting active
  filters
- **Three-tab import**: URL / Paste text / PDF or Photo
- **Edit-in-place** with image URL field
- **Send-to-list** panel with compact/full toggle, per-row editable
  text, last-list memory
- **Inline document viewer** for PDF/image-backed recipes
- **Library grouping** by tag, category, or source type

### Other

- HA Blueprint for share-sheet import (`mobile_app.share`)
- HACS-compatible monorepo layout — integration and card share one
  CHANGELOG, README, and version
