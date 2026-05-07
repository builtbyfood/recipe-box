/**
 * Detail view — full recipe display with ingredients, instructions, actions.
 */
import { LitElement, css, html, type TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, Recipe, ShoppingPreviewItem } from "../types.js";
import type { RecipeBoxApi } from "../utils/api.js";
import { formatApiError } from "../utils/api.js";
import { formatDuration, relativeTime } from "../utils/format.js";

@customElement("recipe-box-detail-view")
export class DetailView extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) recipe?: Recipe;
  @property() slug = "";
  @property() defaultTodo?: string;
  @property({ attribute: false }) api?: RecipeBoxApi;

  @state() private _shoppingOpen = false;
  @state() private _shoppingItems: ShoppingPreviewItem[] = [];
  @state() private _shoppingTodo = "";
  @state() private _shoppingServings?: number;
  @state() private _shoppingCompact = true;
  @state() private _busy = false;
  @state() private _confirmDelete = false;

  // Edit mode state. _draft is a deep-copy of the recipe being edited so
  // Cancel can revert without a refetch.
  @state() private _editing = false;
  @state() private _draft?: Recipe;
  @state() private _savingEdit = false;
  @state() private _editError?: string;
  @state() private _newTagInput = "";

  // Attachment (PDF / image) state — populated when source_type is
  // pdf or image. We fetch through HA auth and stash the blob URL.
  @state() private _attachmentBlobUrl = "";
  @state() private _attachmentLoading = false;
  @state() private _attachmentError = "";

  private _lastLoadedSlug = "";

  willUpdate(changed: Map<string, unknown>): void {
    super.willUpdate?.(changed);
    if (
      this.recipe &&
      this.slug &&
      this.slug !== this._lastLoadedSlug
    ) {
      this._lastLoadedSlug = this.slug;
      void this._loadAttachmentIfNeeded();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._attachmentBlobUrl) {
      URL.revokeObjectURL(this._attachmentBlobUrl);
      this._attachmentBlobUrl = "";
    }
  }

  private async _loadAttachmentIfNeeded(): Promise<void> {
    if (this._attachmentBlobUrl) {
      URL.revokeObjectURL(this._attachmentBlobUrl);
      this._attachmentBlobUrl = "";
    }
    const meta = this.recipe?._recipebox;
    if (!meta || !meta.source_file) return;
    if (meta.source_type !== "pdf" && meta.source_type !== "image") return;

    this._attachmentLoading = true;
    this._attachmentError = "";
    try {
      // hass.auth is not in our type definitions but exists at runtime
      const auth = (this.hass as unknown as {
        auth?: { data?: { access_token?: string }; accessToken?: string };
      }).auth;
      const token = auth?.data?.access_token ?? auth?.accessToken;
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const resp = await fetch(
        `/api/recipe_box/recipes/${this.slug}/attachment`,
        { headers }
      );
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const blob = await resp.blob();
      this._attachmentBlobUrl = URL.createObjectURL(blob);
    } catch (err) {
      this._attachmentError =
        err instanceof Error ? err.message : String(err);
    } finally {
      this._attachmentLoading = false;
    }
  }

  protected render(): TemplateResult {
    if (!this.recipe) return html`<div class="loading">Loading...</div>`;
    const r = this._editing && this._draft ? this._draft : this.recipe;
    const meta = r._recipebox;

    return html`
      <div class="recipe">
        ${r.image
          ? html`<div class="hero" style="background-image: url('${r.image}')"></div>`
          : nothing}

        <div class="content">
          ${this._editing
            ? this._renderEditableHeader(r)
            : r.description
            ? html`<p class="description">${r.description}</p>`
            : nothing}

          <div class="facts">
            ${r.totalTime ? this._fact("mdi:clock-outline", "Total", formatDuration(r.totalTime)) : nothing}
            ${r.prepTime ? this._fact("mdi:knife", "Prep", formatDuration(r.prepTime)) : nothing}
            ${r.cookTime ? this._fact("mdi:pot-steam", "Cook", formatDuration(r.cookTime)) : nothing}
            ${this._editing
              ? this._editableYieldFact(r)
              : r.recipeYield
              ? this._fact("mdi:scale", "Yields", r.recipeYield)
              : nothing}
            ${meta.cooked_count > 0
              ? this._fact("mdi:silverware", "Cooked", `${meta.cooked_count}× (${relativeTime(meta.last_cooked)})`)
              : nothing}
          </div>

          ${this._editing ? nothing : html`
          <div class="actions">
            <button class="primary" @click=${this._startCooking}>
              <ha-icon icon="mdi:chef-hat"></ha-icon> Cook mode
            </button>
            <button @click=${this._toggleShopping}>
              <ha-icon icon="mdi:cart-plus"></ha-icon> Send to list
            </button>
            <button @click=${this._markCooked} ?disabled=${this._busy}>
              <ha-icon icon="mdi:check"></ha-icon> Mark cooked
            </button>
            <button @click=${this._startEdit}>
              <ha-icon icon="mdi:pencil"></ha-icon> Edit
            </button>
            ${meta.source_url
              ? html`<a class="source" href=${meta.source_url} target="_blank" rel="noreferrer">
                  <ha-icon icon="mdi:open-in-new"></ha-icon> ${meta.source_host}
                </a>`
              : meta.source_type
              ? html`<span class="source">
                  <ha-icon icon=${meta.source_type === "pdf" ? "mdi:file-pdf-box" : "mdi:image"}></ha-icon>
                  ${meta.source_type === "pdf" ? "PDF" : "Photo"}
                </span>`
              : nothing}
          </div>`}

          ${this._renderAttachment(meta)}

          ${this._shoppingOpen && !this._editing ? this._renderShoppingPanel() : nothing}

          ${this._shouldShowIngredients(r)
            ? html`<h3>Ingredients</h3>
              ${this._editing
                ? this._renderEditableIngredients(r)
                : html`<ul class="ingredients">
                    ${r.recipeIngredient.map((i) => html`<li>${i}</li>`)}
                  </ul>`}`
            : nothing}

          ${this._shouldShowInstructions(r)
            ? html`<h3>Instructions</h3>
              ${this._editing
                ? this._renderEditableInstructions(r)
                : html`<ol class="instructions">
                    ${r.recipeInstructions.map(
                      (s, i) => html`<li><span class="step-num">${i + 1}</span>${s.text}</li>`
                    )}
                  </ol>`}`
            : nothing}

          ${this._editing
            ? this._renderEditableNotes(meta)
            : meta.notes
            ? html`<h3>Notes</h3>
                <p class="notes">${meta.notes}</p>`
            : nothing}

          ${this._editing
            ? this._renderEditableTags(meta)
            : meta.tags.length
            ? html`<div class="tags">
                ${meta.tags.map((t) => html`<span class="tag-chip">${t}</span>`)}
              </div>`
            : nothing}

          ${this._editError
            ? html`<div class="edit-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon> ${this._editError}
              </div>`
            : nothing}

          <div class="footer-actions">
            ${this._editing
              ? html`<button @click=${this._cancelEdit} ?disabled=${this._savingEdit}>
                    Cancel
                  </button>
                  <button class="primary" @click=${this._saveEdit} ?disabled=${this._savingEdit}>
                    ${this._savingEdit ? "Saving..." : "Save changes"}
                  </button>`
              : this._confirmDelete
              ? html`<span>Delete this recipe?</span>
                  <button class="danger" @click=${this._delete}>Yes, delete</button>
                  <button @click=${() => (this._confirmDelete = false)}>Cancel</button>`
              : html`<button class="danger-link" @click=${() => (this._confirmDelete = true)}>
                  Delete recipe
                </button>`}
          </div>
        </div>
      </div>
    `;
  }

  private _fact(icon: string, label: string, value: string): TemplateResult {
    return html`
      <div class="fact">
        <ha-icon icon=${icon}></ha-icon>
        <div>
          <div class="fact-label">${label}</div>
          <div class="fact-value">${value}</div>
        </div>
      </div>
    `;
  }

  /** Show ingredients section unless this is a doc-backed recipe with no ingredients yet. */
  private _shouldShowIngredients(r: Recipe): boolean {
    if (this._editing) return true;
    if (r.recipeIngredient.length > 0) return true;
    const meta = r._recipebox;
    return !(meta.source_type === "pdf" || meta.source_type === "image");
  }

  private _shouldShowInstructions(r: Recipe): boolean {
    if (this._editing) return true;
    if (r.recipeInstructions.length > 0) return true;
    const meta = r._recipebox;
    return !(meta.source_type === "pdf" || meta.source_type === "image");
  }

  /** Inline viewer for PDF or image source files. */
  private _renderAttachment(meta: Recipe["_recipebox"]): TemplateResult {
    if (meta.source_type !== "pdf" && meta.source_type !== "image") {
      return html``;
    }
    if (this._attachmentLoading) {
      return html`
        <div class="attachment-loading">
          <ha-icon icon="mdi:loading" class="spin"></ha-icon> Loading
          ${meta.source_type === "pdf" ? "PDF" : "image"}...
        </div>
      `;
    }
    if (this._attachmentError) {
      return html`
        <div class="attachment-error">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          Couldn't load attachment: ${this._attachmentError}
        </div>
      `;
    }
    if (!this._attachmentBlobUrl) return html``;
    if (meta.source_type === "image") {
      return html`
        <div class="attachment image">
          <img
            src=${this._attachmentBlobUrl}
            alt=${this.recipe?.name ?? ""}
            @click=${() => window.open(this._attachmentBlobUrl, "_blank")}
          />
        </div>
      `;
    }
    // PDF
    return html`
      <div class="attachment pdf">
        <iframe
          src=${this._attachmentBlobUrl}
          title="Recipe PDF"
          loading="lazy"
        ></iframe>
        <div class="attachment-actions">
          <a href=${this._attachmentBlobUrl} target="_blank" rel="noreferrer">
            <ha-icon icon="mdi:open-in-new"></ha-icon> Open in new tab
          </a>
        </div>
      </div>
    `;
  }

  // ----- Edit-mode section renderers -----

  private _renderEditableHeader(r: Recipe): TemplateResult {
    return html`
      <div class="edit-block">
        <label class="edit-label">Name</label>
        <input
          class="edit-input edit-name"
          type="text"
          .value=${r.name}
          @input=${(e: Event) => {
            this._patchDraft({ name: (e.target as HTMLInputElement).value });
          }}
        />
        <label class="edit-label">Description</label>
        <textarea
          class="edit-input"
          rows="2"
          .value=${r.description ?? ""}
          @input=${(e: Event) =>
            this._patchDraft({
              description: (e.target as HTMLTextAreaElement).value,
            })}
        ></textarea>
        <label class="edit-label">
          Image URL
          <span class="edit-hint">
            paste an image link — Google image search, Imgur, the recipe
            site itself
          </span>
        </label>
        <input
          class="edit-input"
          type="url"
          placeholder="https://..."
          .value=${r.image ?? ""}
          @input=${(e: Event) =>
            this._patchDraft({
              image: (e.target as HTMLInputElement).value,
            })}
        />
        ${r.image
          ? html`<div class="edit-image-preview">
              <img
                src=${r.image}
                alt="preview"
                @error=${(e: Event) =>
                  ((e.target as HTMLImageElement).style.display = "none")}
              />
              <button
                type="button"
                class="text-btn"
                @click=${() => this._patchDraft({ image: "" })}
              >
                <ha-icon icon="mdi:close"></ha-icon> Remove
              </button>
            </div>`
          : nothing}
      </div>
    `;
  }

  private _editableYieldFact(r: Recipe): TemplateResult {
    return html`
      <div class="fact fact-edit">
        <ha-icon icon="mdi:scale"></ha-icon>
        <div>
          <div class="fact-label">Yields</div>
          <input
            class="edit-input fact-input"
            type="text"
            .value=${r.recipeYield ?? ""}
            @input=${(e: Event) =>
              this._patchDraft({
                recipeYield: (e.target as HTMLInputElement).value,
              })}
            placeholder="e.g. 24 cookies"
          />
        </div>
      </div>
    `;
  }

  private _renderEditableIngredients(r: Recipe): TemplateResult {
    return html`
      <ul class="edit-list">
        ${r.recipeIngredient.map(
          (ing, i) => html`<li class="edit-row">
            <input
              type="text"
              class="edit-input"
              .value=${ing}
              @input=${(e: Event) =>
                this._patchIngredient(i, (e.target as HTMLInputElement).value)}
            />
            <button
              class="edit-remove"
              title="Remove"
              @click=${() => this._removeIngredient(i)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </li>`
        )}
      </ul>
      <button class="edit-add" @click=${this._addIngredient}>
        <ha-icon icon="mdi:plus"></ha-icon> Add ingredient
      </button>
    `;
  }

  private _renderEditableInstructions(r: Recipe): TemplateResult {
    return html`
      <ol class="edit-list">
        ${r.recipeInstructions.map(
          (step, i) => html`<li class="edit-row edit-row-step">
            <span class="step-num">${i + 1}</span>
            <textarea
              class="edit-input"
              rows="2"
              .value=${step.text}
              @input=${(e: Event) =>
                this._patchInstruction(
                  i,
                  (e.target as HTMLTextAreaElement).value
                )}
            ></textarea>
            <button
              class="edit-remove"
              title="Remove"
              @click=${() => this._removeInstruction(i)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </li>`
        )}
      </ol>
      <button class="edit-add" @click=${this._addInstruction}>
        <ha-icon icon="mdi:plus"></ha-icon> Add step
      </button>
    `;
  }

  private _renderEditableNotes(meta: Recipe["_recipebox"]): TemplateResult {
    return html`
      <h3>Notes</h3>
      <textarea
        class="edit-input edit-notes"
        rows="4"
        placeholder="Notes — adjustments, substitutions, observations..."
        .value=${meta.notes}
        @input=${(e: Event) =>
          this._patchMeta({ notes: (e.target as HTMLTextAreaElement).value })}
      ></textarea>
    `;
  }

  private _renderEditableTags(meta: Recipe["_recipebox"]): TemplateResult {
    return html`
      <div class="tag-editor">
        ${meta.tags.map(
          (t) => html`<span class="tag-chip editable">
            ${t}
            <button @click=${() => this._removeTag(t)} title="Remove tag">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </span>`
        )}
        <input
          type="text"
          .value=${this._newTagInput}
          placeholder="Add tag..."
          @input=${(e: Event) =>
            (this._newTagInput = (e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              this._commitNewTag();
            }
          }}
          @blur=${this._commitNewTag}
        />
      </div>
    `;
  }

  // ----- Edit handlers -----

  private _startEdit(): void {
    if (!this.recipe) return;
    // Deep-clone for safe drafting
    this._draft = JSON.parse(JSON.stringify(this.recipe)) as Recipe;
    this._editError = undefined;
    this._editing = true;
    this._shoppingOpen = false;
    this._confirmDelete = false;
  }

  private _cancelEdit(): void {
    this._editing = false;
    this._draft = undefined;
    this._editError = undefined;
    this._newTagInput = "";
  }

  private async _saveEdit(): Promise<void> {
    if (!this.api || !this._draft) return;
    this._savingEdit = true;
    this._editError = undefined;
    try {
      // Trim empty entries and commit any pending tag input
      this._commitNewTag();
      const cleaned = this._cleanDraft(this._draft);
      const result = await this.api.update(this.slug, cleaned);
      this.recipe = result.recipe;
      this._editing = false;
      this._draft = undefined;
      // Let parent know so the card-header title updates if name changed
      this.dispatchEvent(
        new CustomEvent("recipe-updated", {
          detail: { slug: this.slug, recipe: result.recipe },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this._editError = formatApiError(err);
    } finally {
      this._savingEdit = false;
    }
  }

  private _patchDraft(patch: Partial<Recipe>): void {
    if (!this._draft) return;
    this._draft = { ...this._draft, ...patch };
  }

  private _patchMeta(patch: Partial<Recipe["_recipebox"]>): void {
    if (!this._draft) return;
    this._draft = {
      ...this._draft,
      _recipebox: { ...this._draft._recipebox, ...patch },
    };
  }

  private _patchIngredient(i: number, value: string): void {
    if (!this._draft) return;
    const arr = [...this._draft.recipeIngredient];
    arr[i] = value;
    this._draft = { ...this._draft, recipeIngredient: arr };
  }

  private _addIngredient(): void {
    if (!this._draft) return;
    this._draft = {
      ...this._draft,
      recipeIngredient: [...this._draft.recipeIngredient, ""],
    };
  }

  private _removeIngredient(i: number): void {
    if (!this._draft) return;
    const arr = this._draft.recipeIngredient.filter((_, j) => j !== i);
    this._draft = { ...this._draft, recipeIngredient: arr };
  }

  private _patchInstruction(i: number, text: string): void {
    if (!this._draft) return;
    const arr = [...this._draft.recipeInstructions];
    arr[i] = { ...arr[i], text };
    this._draft = { ...this._draft, recipeInstructions: arr };
  }

  private _addInstruction(): void {
    if (!this._draft) return;
    this._draft = {
      ...this._draft,
      recipeInstructions: [
        ...this._draft.recipeInstructions,
        { "@type": "HowToStep", text: "" },
      ],
    };
  }

  private _removeInstruction(i: number): void {
    if (!this._draft) return;
    const arr = this._draft.recipeInstructions.filter((_, j) => j !== i);
    this._draft = { ...this._draft, recipeInstructions: arr };
  }

  private _commitNewTag(): void {
    const t = this._newTagInput.trim().toLowerCase().replace(/,$/, "");
    if (!t || !this._draft) {
      this._newTagInput = "";
      return;
    }
    if (!this._draft._recipebox.tags.includes(t)) {
      this._patchMeta({ tags: [...this._draft._recipebox.tags, t] });
    }
    this._newTagInput = "";
  }

  private _removeTag(tag: string): void {
    if (!this._draft) return;
    this._patchMeta({
      tags: this._draft._recipebox.tags.filter((t) => t !== tag),
    });
  }

  private _cleanDraft(draft: Recipe): Recipe {
    // Drop empty ingredient/instruction entries before saving
    const cleaned: Recipe = {
      ...draft,
      recipeIngredient: draft.recipeIngredient
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      recipeInstructions: draft.recipeInstructions
        .map((s) => ({ ...s, text: s.text.trim() }))
        .filter((s) => s.text.length > 0),
    };
    return cleaned;
  }

  private _renderShoppingPanel(): TemplateResult {
    const todoEntities = Object.keys(this.hass.states).filter((id) =>
      id.startsWith("todo.")
    );
    return html`
      <div class="panel">
        <div class="panel-row">
          <label>List:</label>
          <select
            .value=${this._shoppingTodo}
            @change=${(e: Event) => {
              this._shoppingTodo = (e.target as HTMLSelectElement).value;
              this._rememberLastTodo();
              void this._refreshShopping();
            }}
          >
            <option value="">— pick a list —</option>
            ${todoEntities.map(
              (id) => html`<option value=${id}>${id.replace("todo.", "")}</option>`
            )}
          </select>
        </div>
        <div class="panel-row">
          <label>Servings:</label>
          <input
            type="number"
            min="1"
            step="0.5"
            .value=${this._shoppingServings?.toString() ?? ""}
            placeholder="default"
            @change=${(e: Event) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              this._shoppingServings = isNaN(v) ? undefined : v;
              void this._refreshShopping();
            }}
          />
        </div>
        <div class="panel-row">
          <label>Format:</label>
          <div class="seg-toggle">
            <button
              class=${this._shoppingCompact ? "active" : ""}
              @click=${() => this._setCompact(true)}
              title='"flour" instead of "2 1/4 cups all-purpose flour"'
            >
              Just items
            </button>
            <button
              class=${!this._shoppingCompact ? "active" : ""}
              @click=${() => this._setCompact(false)}
              title="Send full ingredient lines as written"
            >
              Full lines
            </button>
          </div>
        </div>
        ${this._shoppingItems.length
          ? html`<div class="shopping-items">
                ${this._shoppingItems.map((item, i) => this._renderShoppingItem(item, i))}
              </div>
              <div class="panel-row right">
                <button @click=${this._toggleShopping}>Cancel</button>
                <button
                  class="primary"
                  @click=${this._sendShopping}
                  ?disabled=${this._busy}
                >
                  Add ${this._shoppingItems.filter((i) => !i.already_on_list).length} items
                </button>
              </div>`
          : this._shoppingTodo
          ? html`<div class="muted">Loading...</div>`
          : nothing}
      </div>
    `;
  }

  private _renderShoppingItem(
    item: ShoppingPreviewItem,
    i: number
  ): TemplateResult {
    return html`
      <div class="shopping-item">
        <input
          class="row-check"
          type="checkbox"
          ?checked=${!item.already_on_list}
          @change=${(e: Event) => {
            const checked = (e.target as HTMLInputElement).checked;
            this._shoppingItems = this._shoppingItems.map((it, j) =>
              j === i ? { ...it, already_on_list: !checked } : it
            );
          }}
        />
        <input
          class="row-text ${item.already_on_list ? "muted" : ""}"
          type="text"
          .value=${item.text}
          @input=${(e: Event) => {
            const value = (e.target as HTMLInputElement).value;
            this._shoppingItems = this._shoppingItems.map((it, j) =>
              j === i ? { ...it, text: value } : it
            );
          }}
          title=${item.original ?? item.text}
        />
        ${item.matched_item
          ? html`<span class="match-hint" title="Already on list">
              ⓘ
            </span>`
          : nothing}
      </div>
    `;
  }

  private _startCooking(): void {
    this.dispatchEvent(
      new CustomEvent("start-cooking", { bubbles: true, composed: true })
    );
  }

  private async _toggleShopping(): Promise<void> {
    this._shoppingOpen = !this._shoppingOpen;
    if (this._shoppingOpen) {
      // Pre-fill from: last-used (localStorage) → card config default → empty
      this._shoppingTodo =
        localStorage.getItem("recipe-box-last-todo") ||
        this.defaultTodo ||
        "";
      this._shoppingCompact =
        localStorage.getItem("recipe-box-shopping-compact") !== "false";
      this._shoppingItems = [];
      if (this._shoppingTodo) await this._refreshShopping();
    }
  }

  private _rememberLastTodo(): void {
    if (this._shoppingTodo) {
      localStorage.setItem("recipe-box-last-todo", this._shoppingTodo);
    }
  }

  private _setCompact(compact: boolean): void {
    this._shoppingCompact = compact;
    localStorage.setItem(
      "recipe-box-shopping-compact",
      compact ? "true" : "false"
    );
    void this._refreshShopping();
  }

  private async _refreshShopping(): Promise<void> {
    if (!this._shoppingTodo || !this.api) return;
    try {
      const preview = await this.api.shoppingPreview(
        this.slug,
        this._shoppingTodo,
        this._shoppingServings,
        this._shoppingCompact
      );
      this._shoppingItems = preview.items;
    } catch (err) {
      console.error(err);
    }
  }

  private async _sendShopping(): Promise<void> {
    if (!this._shoppingTodo) return;
    this._busy = true;
    try {
      // Items where the user kept the checkbox checked → not on list → add.
      // Use whatever text the user has in the editable field.
      for (const item of this._shoppingItems) {
        if (!item.already_on_list && item.text.trim()) {
          await this.hass.callService(
            "todo",
            "add_item",
            { item: item.text.trim() },
            { entity_id: this._shoppingTodo }
          );
        }
      }
      this._shoppingOpen = false;
    } finally {
      this._busy = false;
    }
  }

  private async _markCooked(): Promise<void> {
    if (!this.api) return;
    this._busy = true;
    try {
      const updated = await this.api.markCooked(this.slug);
      this.recipe = updated;
    } finally {
      this._busy = false;
    }
  }

  private async _delete(): Promise<void> {
    if (!this.api) return;
    await this.api.delete(this.slug);
    this.dispatchEvent(
      new CustomEvent("recipe-deleted", { bubbles: true, composed: true })
    );
  }

  static styles = css`
    :host {
      display: block;
    }
    .hero {
      aspect-ratio: 16 / 9;
      background-size: cover;
      background-position: center;
    }
    .content {
      padding: 16px;
    }
    .description {
      color: var(--secondary-text-color);
      font-style: italic;
      margin: 0 0 16px;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .fact {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
    }
    .fact ha-icon {
      --mdc-icon-size: 24px;
      color: var(--primary-color);
    }
    .fact-label {
      font-size: 0.75em;
      color: var(--secondary-text-color);
      text-transform: uppercase;
    }
    .fact-value {
      font-weight: 500;
      font-size: 0.95em;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .actions button,
    .actions a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95em;
      text-decoration: none;
    }
    .actions button:hover {
      background: var(--secondary-background-color);
    }
    .actions .primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .actions .source {
      margin-left: auto;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .panel {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .panel-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .panel-row label {
      min-width: 80px;
      font-weight: 500;
    }
    .panel-row.right {
      justify-content: flex-end;
    }
    .panel-row select,
    .panel-row input {
      flex: 1;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .shopping-items {
      max-height: 320px;
      overflow-y: auto;
      margin: 12px 0;
    }
    .shopping-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .row-check {
      flex-shrink: 0;
    }
    .row-text {
      flex: 1;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 0.95em;
      min-width: 0;
    }
    .row-text:hover {
      border-color: var(--divider-color);
    }
    .row-text:focus {
      outline: none;
      border-color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    .row-text.muted {
      color: var(--secondary-text-color);
      text-decoration: line-through;
    }
    .match-hint {
      font-size: 0.85em;
      color: var(--warning-color, #f59e0b);
      flex-shrink: 0;
      cursor: help;
    }
    .seg-toggle {
      display: inline-flex;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
    }
    .seg-toggle button {
      background: transparent;
      border: 0;
      color: var(--primary-text-color);
      padding: 6px 14px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9em;
    }
    .seg-toggle button.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    h3 {
      margin: 24px 0 12px;
      font-size: 1.15em;
    }
    .ingredients {
      list-style: none;
      padding: 0;
    }
    .ingredients li {
      padding: 6px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .instructions {
      list-style: none;
      padding: 0;
    }
    .instructions li {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      line-height: 1.5;
    }
    .step-num {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-color);
      color: var(--text-primary-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.9em;
    }
    .notes {
      background: var(--secondary-background-color);
      padding: 12px;
      border-radius: 8px;
      white-space: pre-wrap;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 16px;
    }
    .tag-chip {
      background: var(--secondary-background-color);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.85em;
    }
    .footer-actions {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .danger-link {
      background: transparent;
      border: 0;
      color: var(--error-color);
      cursor: pointer;
      font-family: inherit;
    }
    .danger {
      background: var(--error-color);
      color: var(--text-primary-color);
      border: 0;
      border-radius: 8px;
      padding: 6px 14px;
      cursor: pointer;
      font-family: inherit;
    }
    .loading {
      padding: 48px;
      text-align: center;
    }

    /* ----- Edit mode ----- */
    .edit-block {
      margin-bottom: 16px;
    }
    .edit-label {
      display: block;
      font-size: 0.75em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-text-color);
      margin: 8px 0 4px;
    }
    .edit-input {
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 1em;
      box-sizing: border-box;
      resize: vertical;
    }
    .edit-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .edit-name {
      font-size: 1.2em;
      font-weight: 500;
    }
    .edit-hint {
      display: block;
      font-size: 0.85em;
      font-weight: normal;
      color: var(--secondary-text-color);
      text-transform: none;
      letter-spacing: normal;
      margin-top: 2px;
    }
    .edit-image-preview {
      position: relative;
      margin-top: 8px;
      border-radius: 8px;
      overflow: hidden;
      max-width: 280px;
    }
    .edit-image-preview img {
      display: block;
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      background: var(--secondary-background-color);
    }
    .edit-image-preview .text-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.65);
      color: white;
      border: 0;
      padding: 4px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.8em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: inherit;
    }
    .edit-image-preview .text-btn ha-icon {
      --mdc-icon-size: 14px;
    }
    .edit-notes {
      margin-top: 8px;
    }
    .fact-edit {
      flex-direction: row;
      align-items: center;
    }
    .fact-input {
      width: 100%;
      padding: 4px 8px;
      font-size: 0.95em;
    }
    .edit-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .edit-row {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 4px 0;
    }
    .edit-row-step {
      align-items: flex-start;
    }
    .edit-row-step .step-num {
      margin-top: 6px;
    }
    .edit-row .edit-input {
      flex: 1;
    }
    .edit-remove {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 0;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .edit-remove:hover {
      background: var(--secondary-background-color);
      color: var(--error-color);
    }
    .edit-add {
      margin-top: 12px;
      background: transparent;
      border: 1px dashed var(--divider-color);
      color: var(--secondary-text-color);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .edit-add:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .tag-editor {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      margin-top: 12px;
    }
    .tag-editor input {
      flex: 1;
      min-width: 120px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 0.9em;
    }
    .tag-chip.editable {
      background: var(--primary-color);
      color: var(--text-primary-color);
      padding: 2px 4px 2px 10px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .tag-chip.editable button {
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      border-radius: 50%;
      display: inline-flex;
    }
    .tag-chip.editable button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .tag-chip.editable ha-icon {
      --mdc-icon-size: 14px;
    }
    .footer-actions .primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: 0;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-family: inherit;
      margin-left: auto;
    }
    .footer-actions button:not(.danger):not(.danger-link):not(.primary) {
      background: transparent;
      border: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-family: inherit;
    }
    .footer-actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .edit-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color);
      margin-top: 16px;
    }

    /* ---- Document attachments (PDF / photo) ---- */
    .attachment {
      margin: 16px 0 24px;
      border-radius: 12px;
      overflow: hidden;
      background: var(--secondary-background-color);
    }
    .attachment.image img {
      display: block;
      width: 100%;
      max-height: 70vh;
      object-fit: contain;
      cursor: zoom-in;
      background: #000;
    }
    .attachment.pdf iframe {
      display: block;
      width: 100%;
      height: 70vh;
      border: 0;
      background: #525659;
    }
    .attachment-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 12px;
    }
    .attachment-actions a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--primary-text-color);
      text-decoration: none;
      font-size: 0.9em;
      padding: 6px 12px;
      border-radius: 6px;
    }
    .attachment-actions a:hover {
      background: var(--secondary-background-color);
    }
    .attachment-loading,
    .attachment-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      margin: 16px 0;
      border-radius: 8px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .attachment-error {
      color: var(--error-color);
      background: rgba(244, 67, 54, 0.08);
    }
    .spin {
      animation: detail-spin 1.2s linear infinite;
    }
    @keyframes detail-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .source {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-box-detail-view": DetailView;
  }
}
