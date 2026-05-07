/**
 * Library view — grid of recipe cards.
 *
 * Responsive: column count comes from card config but the grid uses
 * `auto-fill, minmax()` so it falls back gracefully on narrow screens.
 * Same component drives both desktop (3-4 columns) and mobile (1 column).
 */
import { LitElement, css, html, type TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  GroupBy,
  QuickFilter,
  RecipeSummary,
  SortBy,
  ViewMode,
} from "../types.js";
import { formatDuration, relativeTime } from "../utils/format.js";

/** Parse ISO 8601 duration like "PT1H30M" → minutes. */
function totalMinutes(iso?: string): number | null {
  if (!iso) return null;
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  return h * 60 + min;
}

@customElement("recipe-box-library-view")
export class LibraryView extends LitElement {
  @property({ attribute: false }) recipes: RecipeSummary[] = [];
  @property({ type: Number }) columns = 3;
  @property({ type: Boolean }) showFilters = false;
  @property({ type: String }) groupBy: GroupBy = "none";

  @state() private _search = "";
  @state() private _activeTags: Set<string> = new Set();
  @state() private _activeChips: Set<QuickFilter> = new Set();
  @state() private _groupOverride?: GroupBy;
  @state() private _sortBy: SortBy = "name";
  @state() private _viewMode: ViewMode = "grid";

  connectedCallback(): void {
    super.connectedCallback();
    const g = localStorage.getItem("recipe-box-group-by");
    if (g && ["none", "tag", "category", "source"].includes(g)) {
      this._groupOverride = g as GroupBy;
    }
    const s = localStorage.getItem("recipe-box-sort-by");
    if (s && ["name", "imported", "last_cooked", "cooked_count", "total_time"].includes(s)) {
      this._sortBy = s as SortBy;
    }
    const v = localStorage.getItem("recipe-box-view-mode");
    if (v === "grid" || v === "list") this._viewMode = v;
  }

  private get _activeGroupBy(): GroupBy {
    return this._groupOverride ?? this.groupBy;
  }

  private _setGroupBy(g: GroupBy): void {
    this._groupOverride = g;
    localStorage.setItem("recipe-box-group-by", g);
  }

  private _setSortBy(s: SortBy): void {
    this._sortBy = s;
    localStorage.setItem("recipe-box-sort-by", s);
  }

  private _setViewMode(v: ViewMode): void {
    this._viewMode = v;
    localStorage.setItem("recipe-box-view-mode", v);
  }

  private _toggleChip(c: QuickFilter): void {
    if (this._activeChips.has(c)) this._activeChips.delete(c);
    else this._activeChips.add(c);
    this._activeChips = new Set(this._activeChips);
  }

  private _selectRecipe(slug: string): void {
    this.dispatchEvent(
      new CustomEvent("recipe-selected", {
        detail: { slug },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _allTags(): string[] {
    const tags = new Set<string>();
    for (const r of this.recipes) {
      for (const t of r.tags) tags.add(t);
    }
    return [...tags].sort();
  }

  private _toggleTag(tag: string): void {
    if (this._activeTags.has(tag)) this._activeTags.delete(tag);
    else this._activeTags.add(tag);
    this._activeTags = new Set(this._activeTags);
  }

  /** Apply search + tag filters + chip filters, then sort. */
  private _filtered(): RecipeSummary[] {
    const q = this._search.trim().toLowerCase();
    const now = Date.now();
    const recentCutoff = now - 14 * 24 * 60 * 60 * 1000; // 14 days

    const filtered = this.recipes.filter((r) => {
      // Search matches name OR ingredients
      if (q) {
        const inName = r.name.toLowerCase().includes(q);
        const inIngredients = (r.ingredients_text || "")
          .toLowerCase()
          .includes(q);
        if (!inName && !inIngredients) return false;
      }
      // Tag filter (intersection — recipe must have ALL active tags)
      if (this._activeTags.size > 0) {
        for (const t of this._activeTags) {
          if (!r.tags.includes(t)) return false;
        }
      }
      // Quick chip filters (intersection — recipe must satisfy ALL active chips)
      for (const chip of this._activeChips) {
        if (chip === "never" && r.cooked_count > 0) return false;
        if (chip === "favorite" && r.cooked_count < 3) return false;
        if (chip === "quick") {
          const m = totalMinutes(r.totalTime);
          if (m === null || m > 30) return false;
        }
        if (chip === "recent") {
          if (!r.last_cooked) return false;
          if (new Date(r.last_cooked).getTime() < recentCutoff) return false;
        }
      }
      return true;
    });

    return this._sorted(filtered);
  }

  private _sorted(items: RecipeSummary[]): RecipeSummary[] {
    const arr = [...items];
    switch (this._sortBy) {
      case "imported":
        arr.sort((a, b) =>
          (b.imported_at ?? "").localeCompare(a.imported_at ?? "")
        );
        break;
      case "last_cooked":
        arr.sort((a, b) => {
          // Never-cooked at the end
          if (!a.last_cooked && !b.last_cooked) return a.name.localeCompare(b.name);
          if (!a.last_cooked) return 1;
          if (!b.last_cooked) return -1;
          return b.last_cooked.localeCompare(a.last_cooked);
        });
        break;
      case "cooked_count":
        arr.sort(
          (a, b) =>
            (b.cooked_count || 0) - (a.cooked_count || 0) ||
            a.name.localeCompare(b.name)
        );
        break;
      case "total_time":
        arr.sort((a, b) => {
          const am = totalMinutes(a.totalTime);
          const bm = totalMinutes(b.totalTime);
          if (am === null && bm === null) return a.name.localeCompare(b.name);
          if (am === null) return 1;
          if (bm === null) return -1;
          return am - bm;
        });
        break;
      default: // name
        arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }

  /** Recipes for the "Cook again" carousel — top by cook count. */
  private _cookAgain(): RecipeSummary[] {
    return [...this.recipes]
      .filter((r) => r.cooked_count > 0)
      .sort((a, b) => (b.cooked_count || 0) - (a.cooked_count || 0))
      .slice(0, 8);
  }

  private _pickRandom(): void {
    const candidates = this._filtered();
    if (candidates.length === 0) return;
    const r = candidates[Math.floor(Math.random() * candidates.length)];
    this._selectRecipe(r.slug);
  }

  protected render(): TemplateResult {
    const filtered = this._filtered();
    const tags = this._allTags();
    const cookAgain = this._cookAgain();

    return html`
      <div class="search-row">
        <ha-icon icon="mdi:magnify"></ha-icon>
        <input
          type="search"
          placeholder="Search name or ingredients..."
          .value=${this._search}
          @input=${(e: Event) =>
            (this._search = (e.target as HTMLInputElement).value)}
        />
        <button
          class="icon-btn"
          @click=${this._pickRandom}
          title="Pick a random recipe (respects active filters)"
        >
          <ha-icon icon="mdi:dice-multiple"></ha-icon>
        </button>
      </div>

      <div class="toolbar-row">
        <select
          class="toolbar-select"
          .value=${this._sortBy}
          @change=${(e: Event) =>
            this._setSortBy(
              (e.target as HTMLSelectElement).value as SortBy
            )}
          title="Sort by..."
        >
          <option value="name">A → Z</option>
          <option value="imported">Recently added</option>
          <option value="last_cooked">Last cooked</option>
          <option value="cooked_count">Most cooked</option>
          <option value="total_time">Quickest</option>
        </select>
        <select
          class="toolbar-select"
          .value=${this._activeGroupBy}
          @change=${(e: Event) =>
            this._setGroupBy(
              (e.target as HTMLSelectElement).value as GroupBy
            )}
          title="Group recipes by..."
        >
          <option value="none">No groups</option>
          <option value="tag">By tag</option>
          <option value="category">By category</option>
          <option value="source">By source</option>
        </select>
        <div class="view-toggle">
          <button
            class=${this._viewMode === "grid" ? "active" : ""}
            @click=${() => this._setViewMode("grid")}
            title="Grid view"
          >
            <ha-icon icon="mdi:view-grid"></ha-icon>
          </button>
          <button
            class=${this._viewMode === "list" ? "active" : ""}
            @click=${() => this._setViewMode("list")}
            title="Compact list view"
          >
            <ha-icon icon="mdi:view-list"></ha-icon>
          </button>
        </div>
      </div>

      <div class="chip-row">
        ${this._chipButton("never", "mdi:sparkles", "Never tried")}
        ${this._chipButton("quick", "mdi:lightning-bolt", "Quick")}
        ${this._chipButton("recent", "mdi:clock-outline", "Cooked recently")}
        ${this._chipButton("favorite", "mdi:star", "Favorites")}
      </div>

      ${this.showFilters && tags.length
        ? html`<div class="tag-row">
            ${tags.map(
              (t) => html`<button
                class="tag ${this._activeTags.has(t) ? "active" : ""}"
                @click=${() => this._toggleTag(t)}
              >
                ${t}
              </button>`
            )}
          </div>`
        : nothing}

      ${cookAgain.length > 0 &&
      this._activeChips.size === 0 &&
      this._activeTags.size === 0 &&
      !this._search
        ? html`<div class="cook-again-section">
            <div class="section-header">
              <ha-icon icon="mdi:silverware-fork-knife"></ha-icon>
              <span>Cook again</span>
            </div>
            <div class="cook-again-row">
              ${cookAgain.map((r) => this._renderMiniTile(r))}
            </div>
          </div>`
        : nothing}

      ${filtered.length === 0
        ? html`<div class="empty">
            ${this.recipes.length === 0
              ? html`<p>No recipes yet. Add one to get started.</p>`
              : html`<p>No recipes match.</p>`}
          </div>`
        : this._activeGroupBy === "none"
        ? this._renderRecipeContainer(filtered)
        : this._renderGrouped(filtered)}
    `;
  }

  private _chipButton(
    chip: QuickFilter,
    icon: string,
    label: string
  ): TemplateResult {
    const active = this._activeChips.has(chip);
    return html`
      <button
        class="chip ${active ? "active" : ""}"
        @click=${() => this._toggleChip(chip)}
      >
        <ha-icon icon=${icon}></ha-icon> ${label}
      </button>
    `;
  }

  private _renderRecipeContainer(items: RecipeSummary[]): TemplateResult {
    if (this._viewMode === "list") {
      return html`<div class="recipe-list">
        ${items.map((r) => this._renderListRow(r))}
      </div>`;
    }
    return html`<div class="grid" style="--cols: ${this.columns}">
      ${items.map((r) => this._renderCard(r))}
    </div>`;
  }

  private _renderMiniTile(r: RecipeSummary): TemplateResult {
    return html`
      <button class="mini-tile" @click=${() => this._selectRecipe(r.slug)}>
        <div
          class="mini-hero ${r.image ? "" : "no-image"}"
          style=${r.image ? `background-image: url('${r.image}')` : ""}
        >
          ${r.image
            ? nothing
            : html`<ha-icon icon="mdi:silverware-fork-knife"></ha-icon>`}
        </div>
        <div class="mini-name">${r.name}</div>
        <div class="mini-sub">${r.cooked_count}× cooked</div>
      </button>
    `;
  }

  private _renderListRow(r: RecipeSummary): TemplateResult {
    const sourceIcon =
      r.source_type === "pdf"
        ? "mdi:file-pdf-box"
        : r.source_type === "image"
        ? "mdi:image"
        : null;
    return html`
      <button class="list-row" @click=${() => this._selectRecipe(r.slug)}>
        <div
          class="list-thumb ${r.image ? "" : "no-image"}"
          style=${r.image ? `background-image: url('${r.image}')` : ""}
        >
          ${r.image
            ? nothing
            : html`<ha-icon
                icon=${sourceIcon ?? "mdi:silverware-fork-knife"}
              ></ha-icon>`}
        </div>
        <div class="list-content">
          <div class="list-name">${r.name}</div>
          <div class="list-sub">
            ${r.totalTime
              ? html`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${formatDuration(r.totalTime)}</span>`
              : nothing}
            ${r.cooked_count > 0
              ? html`<span><ha-icon icon="mdi:silverware"></ha-icon>${r.cooked_count}×</span>`
              : nothing}
            ${r.last_cooked
              ? html`<span title="Last cooked">${relativeTime(r.last_cooked)}</span>`
              : nothing}
            ${r.tags.length
              ? html`<span class="list-tags">${r.tags.slice(0, 2).join(" · ")}</span>`
              : nothing}
          </div>
        </div>
        ${sourceIcon
          ? html`<ha-icon class="list-source" icon=${sourceIcon}></ha-icon>`
          : nothing}
      </button>
    `;
  }

  private _renderGrouped(items: RecipeSummary[]): TemplateResult {
    const groups = this._buildGroups(items);
    return html`
      ${groups.map(
        ([key, list]) => html`
          <div class="group">
            <div class="group-header">
              <span class="group-name">${key}</span>
              <span class="group-count">${list.length}</span>
            </div>
            ${this._renderRecipeContainer(list)}
          </div>
        `
      )}
    `;
  }

  /** Build [groupName, recipes[]] pairs based on the active group mode. */
  private _buildGroups(items: RecipeSummary[]): [string, RecipeSummary[]][] {
    const groups = new Map<string, RecipeSummary[]>();

    const push = (key: string, r: RecipeSummary) => {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    };

    for (const r of items) {
      switch (this._activeGroupBy) {
        case "tag":
          if (r.tags.length === 0) {
            push("Untagged", r);
          } else {
            // Show recipe under each of its tags so it's findable both ways
            for (const t of r.tags) push(t, r);
          }
          break;
        case "category":
          push(r.recipeCategory?.trim() || "Uncategorized", r);
          break;
        case "source": {
          const t = r.source_type ?? "web";
          push(
            t === "pdf" ? "PDF" : t === "image" ? "Photo" : "Web",
            r
          );
          break;
        }
        default:
          push("All", r);
      }
    }

    // Sort: alphabetical, but "Untagged" / "Uncategorized" / "Other" last
    const last = ["Untagged", "Uncategorized", "Other"];
    return [...groups.entries()].sort(([a], [b]) => {
      const aLast = last.includes(a);
      const bLast = last.includes(b);
      if (aLast && !bLast) return 1;
      if (!aLast && bLast) return -1;
      return a.localeCompare(b);
    });
  }

  private _renderCard(r: RecipeSummary): TemplateResult {
    const sourceIcon =
      r.source_type === "pdf"
        ? "mdi:file-pdf-box"
        : r.source_type === "image"
        ? "mdi:image"
        : null;
    return html`
      <button class="recipe-tile" @click=${() => this._selectRecipe(r.slug)}>
        <div
          class="hero ${r.image ? "" : "no-image"}"
          style=${r.image ? `background-image: url('${r.image}')` : ""}
        >
          ${r.image
            ? nothing
            : html`<ha-icon icon=${sourceIcon ?? "mdi:silverware-fork-knife"}></ha-icon>`}
          ${sourceIcon
            ? html`<span class="source-badge" title=${r.source_type ?? ""}>
                <ha-icon icon=${sourceIcon}></ha-icon>
              </span>`
            : nothing}
        </div>
        <div class="meta">
          <div class="name">${r.name}</div>
          <div class="sub">
            ${r.totalTime
              ? html`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${formatDuration(r.totalTime)}</span>`
              : nothing}
            ${r.cooked_count > 0
              ? html`<span><ha-icon icon="mdi:silverware"></ha-icon>${r.cooked_count}×</span>`
              : nothing}
            ${r.last_cooked
              ? html`<span title="Last cooked">${relativeTime(r.last_cooked)}</span>`
              : nothing}
          </div>
          ${r.tags.length
            ? html`<div class="tags">
                ${r.tags.slice(0, 3).map((t) => html`<span class="tag-chip">${t}</span>`)}
              </div>`
            : nothing}
        </div>
      </button>
    `;
  }

  static styles = css`
    :host {
      display: block;
      padding: 12px 16px 16px;
    }
    .search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 12px;
      margin-bottom: 12px;
      color: var(--secondary-text-color);
    }
    .search-row input {
      flex: 1;
      background: transparent;
      border: 0;
      outline: 0;
      font-size: 1em;
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .group-select,
    .toolbar-select {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      color: var(--primary-text-color);
      padding: 4px 8px;
      font-family: inherit;
      font-size: 0.85em;
      cursor: pointer;
      flex: 1;
      min-width: 0;
    }
    .icon-btn {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      color: var(--primary-text-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-btn:hover {
      background: var(--secondary-background-color);
    }
    .toolbar-row {
      display: flex;
      gap: 6px;
      align-items: stretch;
      margin-bottom: 8px;
    }
    .view-toggle {
      display: inline-flex;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .view-toggle button {
      background: var(--card-background-color);
      border: 0;
      color: var(--primary-text-color);
      padding: 4px 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }
    .view-toggle button.active {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
    }
    .view-toggle ha-icon {
      --mdc-icon-size: 18px;
    }
    .chip-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      font-family: inherit;
      transition: background 0.15s, border-color 0.15s;
    }
    .chip ha-icon {
      --mdc-icon-size: 14px;
    }
    .chip.active {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border-color: var(--primary-color);
    }

    /* "Cook again" carousel */
    .cook-again-section {
      margin-bottom: 16px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.95em;
      font-weight: 500;
      margin: 8px 0;
      color: var(--secondary-text-color);
    }
    .section-header ha-icon {
      --mdc-icon-size: 18px;
    }
    .cook-again-row {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .cook-again-row::-webkit-scrollbar {
      height: 4px;
    }
    .cook-again-row::-webkit-scrollbar-thumb {
      background: var(--divider-color);
      border-radius: 2px;
    }
    .mini-tile {
      flex: 0 0 110px;
      scroll-snap-align: start;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      text-align: left;
      color: inherit;
      font-family: inherit;
    }
    .mini-hero {
      width: 100%;
      aspect-ratio: 1.2 / 1;
      background-size: cover;
      background-position: center;
      background-color: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mini-hero ha-icon {
      color: var(--secondary-text-color);
    }
    .mini-name {
      padding: 6px 8px 0;
      font-size: 0.8em;
      font-weight: 500;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .mini-sub {
      padding: 2px 8px 8px;
      font-size: 0.7em;
      color: var(--secondary-text-color);
    }

    /* List view */
    .recipe-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .list-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      color: inherit;
      font-family: inherit;
      transition: background 0.1s;
    }
    .list-row:hover {
      background: var(--secondary-background-color);
    }
    .list-thumb {
      flex: 0 0 56px;
      width: 56px;
      height: 56px;
      border-radius: 8px;
      background-size: cover;
      background-position: center;
      background-color: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .list-thumb ha-icon {
      --mdc-icon-size: 24px;
      color: var(--secondary-text-color);
    }
    .list-content {
      flex: 1;
      min-width: 0;
    }
    .list-name {
      font-weight: 500;
      font-size: 0.95em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .list-sub {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 0.75em;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }
    .list-sub span {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .list-sub ha-icon {
      --mdc-icon-size: 12px;
    }
    .list-tags {
      font-style: italic;
    }
    .list-source {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .group {
      margin-bottom: 24px;
    }
    .group-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 16px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--divider-color);
    }
    .group-name {
      font-size: 1.1em;
      font-weight: 500;
      text-transform: capitalize;
    }
    .group-count {
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }
    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    .tag {
      background: var(--secondary-background-color);
      border: 0;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 0.85em;
      cursor: pointer;
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .tag.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(220px, 100%), 1fr)
      );
      gap: 12px;
    }
    @media (min-width: 700px) {
      .grid {
        grid-template-columns: repeat(var(--cols, 3), 1fr);
      }
    }
    .recipe-tile {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      text-align: left;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: inherit;
      color: var(--primary-text-color);
    }
    .recipe-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .hero {
      aspect-ratio: 16 / 10;
      background-size: cover;
      background-position: center;
      background-color: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .source-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .source-badge ha-icon {
      --mdc-icon-size: 16px;
    }
    .hero.no-image ha-icon {
      --mdc-icon-size: 48px;
      color: var(--secondary-text-color);
      opacity: 0.5;
    }
    .meta {
      padding: 12px;
    }
    .name {
      font-weight: 500;
      font-size: 1em;
      margin-bottom: 6px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .sub {
      display: flex;
      gap: 12px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
    .sub span {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .sub ha-icon {
      --mdc-icon-size: 14px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tag-chip {
      background: var(--secondary-background-color);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.75em;
    }
    .empty {
      padding: 48px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-box-library-view": LibraryView;
  }
}
