# Changelog

All notable changes to this project are documented here.

## [0.3.1] — 2026-05-07

Mobile UI fixes for glassmorphism dashboards.

### Fixed
- **Card font no longer affected by Android system font scaling** —
  `:host` now anchors base size in pixels via
  `--recipe-box-base-font-size` (default 14px). Set this CSS variable
  on the wrapping `ha-card` to scale the card up or down without
  Samsung/Android Accessibility "Large/Huge" font settings inflating
  detail and edit views.
- **Send-to-list dropdown options are visible** — `<select>` and
  `<option>` elements now use explicit white-bg/dark-fg colors that
  survive translucent theme overrides. Native dropdown popups on
  Android/iOS no longer render text-on-same-color.
- **No imposed minimum height on the card** — `ha-card` inside the
  recipe-box-card now sets `min-height: auto` so wrapper cards
  (`mod-card`, masonry layouts) don't stretch the card past its
  natural content height.
- **Library sort/group dropdowns** — same explicit color treatment
  applied so they're readable in dark glass themes.

### Added
- `examples/mobile-dashboard-glass.yaml` — production-ready
  glassmorphism mobile dashboard that overrides `--ha-card-background`
  (only ha-card elements) instead of `--card-background-color` (form
  controls), preventing dropdown invisibility.

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
