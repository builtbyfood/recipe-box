/**
 * Recipe Box card — the main element registered with HA.
 *
 * Routes between four sub-views (library / detail / cook / import) based
 * on `view:` config option. The same card primitive composes differently
 * across the desktop and mobile dashboards (see examples/).
 */
import { LitElement, css, html, type TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./views/library-view.js";
import "./views/detail-view.js";
import "./views/cook-view.js";
import "./views/import-view.js";
import { RecipeBoxApi } from "./utils/api.js";
import type {
  CardView,
  HomeAssistant,
  Recipe,
  RecipeBoxCardConfig,
  RecipeSummary,
} from "./types.js";

@customElement("recipe-box-card")
export class RecipeBoxCard extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config?: RecipeBoxCardConfig;
  @state() private _view: CardView = "library";
  @state() private _activeRecipe?: Recipe;
  @state() private _activeSlug?: string;
  @state() private _library: RecipeSummary[] = [];
  @state() private _loading = false;
  @state() private _error?: string;

  private _api?: RecipeBoxApi;

  setConfig(config: RecipeBoxCardConfig): void {
    if (!config) throw new Error("Invalid configuration");
    this._config = config;
    this._view = config.view || "library";
  }

  getCardSize(): number {
    return 8;
  }

  static getStubConfig(): RecipeBoxCardConfig {
    return { type: "custom:recipe-box-card", view: "library" };
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    if (this.hass && !this._api) {
      this._api = new RecipeBoxApi(this.hass);
      this._loadLibrary();
    }
    // If config slug changed (e.g. user picked a recipe), load it.
    if (
      changed.has("_config") &&
      this._config?.recipe_id &&
      this._config.recipe_id !== this._activeSlug
    ) {
      void this._loadRecipe(this._config.recipe_id);
    }
  }

  private async _loadLibrary(): Promise<void> {
    if (!this._api) return;
    this._loading = true;
    try {
      this._library = await this._api.list();
      this._error = undefined;
    } catch (err) {
      this._error = String(err);
    } finally {
      this._loading = false;
    }
  }

  private async _loadRecipe(slug: string): Promise<void> {
    if (!this._api) return;
    this._loading = true;
    try {
      this._activeRecipe = await this._api.get(slug);
      this._activeSlug = slug;
      this._error = undefined;
    } catch (err) {
      this._error = String(err);
    } finally {
      this._loading = false;
    }
  }

  private _onSelectRecipe(e: CustomEvent<{ slug: string }>): void {
    void this._loadRecipe(e.detail.slug).then(() => {
      this._view = "detail";
    });
  }

  private _onStartCooking(): void {
    if (this._activeRecipe) this._view = "cook";
  }

  private _onBack(): void {
    this._view = "library";
    this._activeRecipe = undefined;
    this._activeSlug = undefined;
  }

  private _onShowImport(): void {
    this._view = "import";
  }

  private _onImportComplete(e: CustomEvent<{ slug: string }>): void {
    void this._loadLibrary();
    void this._loadRecipe(e.detail.slug).then(() => (this._view = "detail"));
  }

  protected render(): TemplateResult {
    if (!this._config) return html`<ha-card>Configuration error</ha-card>`;
    if (this._error) {
      return html`<ha-card class="error">
        <div class="error-content">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <div>${this._error}</div>
          <button @click=${() => { this._error = undefined; this._loadLibrary(); }}>
            Retry
          </button>
        </div>
      </ha-card>`;
    }

    return html`
      <ha-card>
        ${this._renderHeader()}
        ${this._renderView()}
      </ha-card>
    `;
  }

  private _renderHeader(): TemplateResult | typeof nothing {
    // Library view always shows the header (the Add button lives there).
    // Other views show the header only when there's a back action or an
    // active recipe name to display.
    if (this._view === "library") {
      const title = this._config?.title ?? "Recipes";
      return html`
        <div class="card-header">
          <span class="title">${title}</span>
          <button class="add-btn" @click=${this._onShowImport}>
            <ha-icon icon="mdi:plus"></ha-icon> Add
          </button>
        </div>
      `;
    }
    const title =
      this._view === "import"
        ? "Import recipe"
        : this._activeRecipe?.name ?? "";
    return html`
      <div class="card-header">
        <button class="back-btn" @click=${this._onBack}>
          <ha-icon icon="mdi:arrow-left"></ha-icon>
        </button>
        <span class="title">${title}</span>
      </div>
    `;
  }

  private _renderView(): TemplateResult {
    if (this._loading) {
      return html`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;
    }
    switch (this._view) {
      case "library":
        return html`<recipe-box-library-view
          .recipes=${this._library}
          .columns=${this._config?.columns ?? 3}
          .showFilters=${this._config?.show_filters ?? false}
          .groupBy=${this._config?.group_by ?? "none"}
          @recipe-selected=${this._onSelectRecipe}
        ></recipe-box-library-view>`;
      case "detail":
        return html`<recipe-box-detail-view
          .hass=${this.hass}
          .recipe=${this._activeRecipe}
          .slug=${this._activeSlug ?? ""}
          .defaultTodo=${this._config?.default_todo}
          .api=${this._api}
          @start-cooking=${this._onStartCooking}
          @recipe-deleted=${this._onBack}
        ></recipe-box-detail-view>`;
      case "cook":
        return html`<recipe-box-cook-view
          .hass=${this.hass}
          .recipe=${this._activeRecipe}
          .slug=${this._activeSlug ?? ""}
          .api=${this._api}
        ></recipe-box-cook-view>`;
      case "import":
        return html`<recipe-box-import-view
          .api=${this._api}
          .existingTags=${this._library.flatMap((r) => r.tags)}
          @import-complete=${this._onImportComplete}
        ></recipe-box-import-view>`;
    }
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      overflow: hidden;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    .card-header .title {
      flex: 1;
      font-size: 1.4em;
      font-weight: 500;
    }
    .card-header button {
      background: transparent;
      border: 0;
      cursor: pointer;
      color: var(--primary-text-color);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.95em;
    }
    .card-header button:hover {
      background: var(--secondary-background-color);
    }
    .card-header .add-btn {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    ha-card.error {
      padding: 24px;
    }
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--error-color);
    }
  `;
}

// Register with HA's card list for the dashboard editor
(window as unknown as { customCards?: unknown[] }).customCards =
  (window as unknown as { customCards?: unknown[] }).customCards ?? [];
((window as unknown as { customCards: unknown[] }).customCards).push({
  type: "recipe-box-card",
  name: "Recipe Box",
  description: "Browse, import, and cook recipes from your Recipe Box.",
});

declare global {
  interface HTMLElementTagNameMap {
    "recipe-box-card": RecipeBoxCard;
  }
}
