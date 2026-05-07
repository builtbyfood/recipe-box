/**
 * Import view — paste URL, preview, review, save.
 *
 * Flow:
 * 1. User pastes URL → POST /preview returns parsed recipe (no save)
 * 2. Card shows review screen with editable slug/tags/notes
 * 3. If conflicts exist, conflict resolution UI appears
 * 4. User clicks Save → POST /recipes commits
 */
import { LitElement, css, html, type TemplateResult, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { PreviewResponse, Recipe } from "../types.js";
import type { RecipeBoxApi } from "../utils/api.js";
import { formatApiError } from "../utils/api.js";
import { slugify } from "../utils/format.js";

type Stage = "url" | "loading" | "review" | "file" | "file-uploading";
type ConflictMode = "error" | "overwrite" | "new_copy";
type InputMode = "url" | "file" | "text";

@customElement("recipe-box-import-view")
export class ImportView extends LitElement {
  @property({ attribute: false }) api?: RecipeBoxApi;
  @property({ type: Array }) existingTags: string[] = [];

  @state() private _stage: Stage = "url";
  @state() private _inputMode: InputMode = "url";
  @state() private _url = "";
  @state() private _pastedText = "";
  @state() private _preview?: PreviewResponse;
  @state() private _editedSlug = "";
  @state() private _editedTags: string[] = [];
  @state() private _editedNotes = "";
  @state() private _conflictMode: ConflictMode = "new_copy";
  @state() private _busy = false;
  @state() private _error?: string;

  // File-upload state
  @state() private _fileType: "pdf" | "image" | null = null;
  @state() private _fileB64 = "";
  @state() private _fileOriginalName = "";
  @state() private _filePreviewUrl = "";  // object URL for visual preview
  @state() private _fileRecipeName = "";
  @state() private _fileTags: string[] = [];
  @state() private _fileNotes = "";

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._filePreviewUrl) URL.revokeObjectURL(this._filePreviewUrl);
  }

  private async _runPreview(): Promise<void> {
    if (!this.api) return;
    const url = this._url.trim();

    // URL is required for url mode; text mode can run without it
    if (this._inputMode !== "text" && !url) {
      this._error = "URL is required.";
      return;
    }
    if (this._inputMode === "text" && !this._pastedText.trim()) {
      this._error = "Paste the recipe text.";
      return;
    }
    this._stage = "loading";
    this._error = undefined;
    try {
      const preview = await this.api.preview(
        url,
        undefined,
        this._inputMode === "text" ? this._pastedText : undefined
      );
      this._preview = preview;
      this._editedSlug = preview.recipe._recipebox.suggested_slug;
      this._editedTags = [...(preview.recipe._recipebox.tags || [])];
      this._editedNotes = preview.recipe._recipebox.notes || "";
      this._conflictMode = preview.conflicts.slug_taken ? "new_copy" : "error";
      this._stage = "review";
    } catch (err) {
      this._error = formatApiError(err);
      this._stage = "url";
    }
  }

  private async _save(): Promise<void> {
    if (!this.api || !this._preview) return;
    this._busy = true;
    try {
      // Build the recipe with user edits
      const recipe: Recipe = {
        ...this._preview.recipe,
        _recipebox: {
          ...this._preview.recipe._recipebox,
          tags: this._editedTags,
          notes: this._editedNotes,
        },
      };
      const result = await this.api.save(recipe, {
        slug: this._editedSlug,
        on_conflict: this._conflictMode,
      });
      this.dispatchEvent(
        new CustomEvent("import-complete", {
          detail: { slug: result.slug },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this._error = formatApiError(err);
    } finally {
      this._busy = false;
    }
  }

  private _addTag(tag: string): void {
    const t = tag.trim().toLowerCase();
    if (t && !this._editedTags.includes(t)) {
      this._editedTags = [...this._editedTags, t];
    }
  }

  private _removeTag(tag: string): void {
    this._editedTags = this._editedTags.filter((t) => t !== tag);
  }

  protected render(): TemplateResult {
    if (
      this._stage === "url" ||
      this._stage === "loading" ||
      this._stage === "file-uploading"
    ) {
      return this._renderUrlStage();
    }
    return this._renderReviewStage();
  }

  private _renderUrlStage(): TemplateResult {
    return html`
      <div class="url-stage">
        <p class="hint">
          Paste a recipe URL. The integration will strip the fluff and
          show you a clean preview before saving.
        </p>

        <div class="mode-toggle">
          <button
            class=${this._inputMode === "url" ? "active" : ""}
            @click=${() => (this._inputMode = "url")}
            ?disabled=${this._stage === "loading"}
          >
            <ha-icon icon="mdi:link"></ha-icon> URL
          </button>
          <button
            class=${this._inputMode === "text" ? "active" : ""}
            @click=${() => (this._inputMode = "text")}
            ?disabled=${this._stage === "loading"}
          >
            <ha-icon icon="mdi:content-paste"></ha-icon> Paste text
          </button>
          <button
            class=${this._inputMode === "file" ? "active" : ""}
            @click=${() => (this._inputMode = "file")}
            ?disabled=${this._stage === "loading"}
          >
            <ha-icon icon="mdi:file-upload"></ha-icon> PDF / Photo
          </button>
        </div>

        ${this._inputMode === "file"
          ? this._renderFileMode()
          : this._inputMode === "text"
          ? this._renderTextMode()
          : this._renderUrlMode()}

        ${this._error
          ? html`<div class="error">
              <ha-icon icon="mdi:alert-circle"></ha-icon> ${this._error}
            </div>`
          : nothing}
      </div>
    `;
  }

  private _renderUrlMode(): TemplateResult {
    return html`
        <div class="url-row">
          <input
            type="url"
            placeholder="https://..."
            .value=${this._url}
            @input=${(e: Event) =>
              (this._url = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") void this._runPreview();
            }}
            ?disabled=${this._stage === "loading"}
          />
          <button
            class="primary"
            ?disabled=${this._stage === "loading" || !this._url.trim()}
            @click=${this._runPreview}
          >
            ${this._stage === "loading" ? "Parsing..." : "Preview"}
          </button>
        </div>
    `;
  }

  private _renderTextMode(): TemplateResult {
    return html`
      <p class="paste-hint">
        For Cloudflare-blocked sites: open the recipe in your browser,
        select the recipe content (title through directions), copy, paste
        below. The parser looks for headers like
        <code>Ingredients</code> and <code>Directions</code> to find the
        sections. URL is optional — leave blank or include for reference.
      </p>
      <div class="url-row">
        <input
          type="url"
          placeholder="Source URL (optional)"
          .value=${this._url}
          @input=${(e: Event) =>
            (this._url = (e.target as HTMLInputElement).value)}
          ?disabled=${this._stage === "loading"}
        />
      </div>
      <textarea
        class="html-paste"
        rows="14"
        placeholder="Paste recipe content here...

Example:
My Best Cookies
Total: 30 min
Serves: 24

Ingredients
2 1/4 cups flour
1 cup butter
...

Directions
Preheat oven to 375F
Mix ingredients
..."
        .value=${this._pastedText}
        @input=${(e: Event) =>
          (this._pastedText = (e.target as HTMLTextAreaElement).value)}
        ?disabled=${this._stage === "loading"}
      ></textarea>
      <div class="paste-actions">
        <span class="byte-count">
          ${this._pastedText.length.toLocaleString()} chars
        </span>
        <button
          class="primary"
          ?disabled=${this._stage === "loading" || !this._pastedText.trim()}
          @click=${this._runPreview}
        >
          ${this._stage === "loading" ? "Parsing..." : "Preview"}
        </button>
      </div>
    `;
  }

  private _renderFileMode(): TemplateResult {
    const uploading = this._stage === "file-uploading";
    return html`
      <p class="paste-hint">
        Upload a PDF or a photo of a printed recipe. The file is stored
        alongside the recipe and shown inline. You can transcribe the
        ingredients/instructions later via the Edit button if you want
        them searchable, or just leave them empty and use the photo as the
        canonical reference.
      </p>

      ${this._fileB64
        ? html`
            <div class="file-preview">
              ${this._fileType === "image" && this._filePreviewUrl
                ? html`<img src=${this._filePreviewUrl} alt="preview" />`
                : html`
                    <div class="file-preview-pdf">
                      <ha-icon icon="mdi:file-pdf-box"></ha-icon>
                      <div>
                        <div>${this._fileOriginalName}</div>
                        <div class="muted">
                          ${(this._fileB64.length * 0.75 / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                  `}
              <button
                class="text-btn"
                @click=${this._clearFile}
                ?disabled=${uploading}
              >
                <ha-icon icon="mdi:close"></ha-icon> Remove
              </button>
            </div>

            <div class="field">
              <label>Recipe name</label>
              <input
                type="text"
                .value=${this._fileRecipeName}
                placeholder="e.g. Grandma's Meatloaf"
                @input=${(e: Event) =>
                  (this._fileRecipeName = (e.target as HTMLInputElement).value)}
              />
            </div>

            <div class="field">
              <label>Tags</label>
              <div class="tag-editor">
                ${this._fileTags.map(
                  (t) => html`<span class="tag-chip">
                    ${t}
                    <button
                      @click=${() => this._removeFileTag(t)}
                      title="Remove"
                    >
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </span>`
                )}
                <input
                  type="text"
                  placeholder="Add tag..."
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      const t = e.target as HTMLInputElement;
                      this._addFileTag(t.value);
                      t.value = "";
                    }
                  }}
                />
              </div>
              ${this.existingTags.length
                ? html`<div class="tag-suggestions">
                    ${this.existingTags
                      .filter((t) => !this._fileTags.includes(t))
                      .slice(0, 8)
                      .map(
                        (t) => html`<button
                          class="suggestion"
                          @click=${() => this._addFileTag(t)}
                        >
                          + ${t}
                        </button>`
                      )}
                  </div>`
                : nothing}
            </div>

            <div class="field">
              <label>Notes</label>
              <textarea
                rows="2"
                placeholder="Optional notes..."
                .value=${this._fileNotes}
                @input=${(e: Event) =>
                  (this._fileNotes = (e.target as HTMLTextAreaElement).value)}
              ></textarea>
            </div>

            <div class="paste-actions">
              <span class="byte-count"></span>
              <button
                class="primary"
                ?disabled=${uploading || !this._fileRecipeName.trim()}
                @click=${this._uploadFile}
              >
                ${uploading ? "Uploading..." : "Save recipe"}
              </button>
            </div>
          `
        : html`
            <label class="file-drop">
              <input
                type="file"
                accept=".pdf,image/*"
                @change=${this._onFileSelected}
                hidden
              />
              <ha-icon icon="mdi:file-upload-outline"></ha-icon>
              <div>
                <strong>Choose a file</strong>
                <span class="muted">or drag here — PDF or image</span>
              </div>
            </label>
          `}
    `;
  }

  private _onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this._error = "File too large (max 10MB).";
      return;
    }

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      this._error = "Only PDF or image files are supported.";
      return;
    }

    this._fileType = isPdf ? "pdf" : "image";
    this._fileOriginalName = file.name;
    this._fileRecipeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    this._error = undefined;

    if (this._filePreviewUrl) URL.revokeObjectURL(this._filePreviewUrl);
    if (isImage) {
      this._filePreviewUrl = URL.createObjectURL(file);
    } else {
      this._filePreviewUrl = "";
    }

    // Read as base64
    const reader = new FileReader();
    reader.onload = () => {
      // result is data:<mime>;base64,<payload>
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      this._fileB64 = comma >= 0 ? dataUrl.slice(comma + 1) : "";
    };
    reader.onerror = () => {
      this._error = "Failed to read file.";
    };
    reader.readAsDataURL(file);
  }

  private _addFileTag(tag: string): void {
    const t = tag.trim().toLowerCase();
    if (t && !this._fileTags.includes(t)) {
      this._fileTags = [...this._fileTags, t];
    }
  }

  private _removeFileTag(tag: string): void {
    this._fileTags = this._fileTags.filter((t) => t !== tag);
  }

  private _clearFile(): void {
    if (this._filePreviewUrl) URL.revokeObjectURL(this._filePreviewUrl);
    this._fileType = null;
    this._fileOriginalName = "";
    this._fileB64 = "";
    this._filePreviewUrl = "";
    this._fileRecipeName = "";
    this._fileTags = [];
    this._fileNotes = "";
  }

  private async _uploadFile(): Promise<void> {
    if (!this.api || !this._fileB64 || !this._fileType) return;
    const name = this._fileRecipeName.trim();
    if (!name) {
      this._error = "Recipe name is required.";
      return;
    }
    this._stage = "file-uploading";
    this._error = undefined;
    try {
      const result = await this.api.uploadFile({
        name,
        file_b64: this._fileB64,
        file_type: this._fileType,
        filename: this._fileOriginalName,
        tags: this._fileTags,
        notes: this._fileNotes,
        on_conflict: "new_copy",
      });
      this.dispatchEvent(
        new CustomEvent("import-complete", {
          detail: { slug: result.slug },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      this._error = formatApiError(err);
      this._stage = "url";
    }
  }

  private _renderReviewStage(): TemplateResult {
    const r = this._preview!.recipe;
    const conflicts = this._preview!.conflicts;
    const hasConflict = !!conflicts.slug_taken || !!conflicts.url_already_imported;

    return html`
      <div class="review">
        ${r.image
          ? html`<div class="hero" style="background-image: url('${r.image}')"></div>`
          : nothing}

        <div class="content">
          <h2>${r.name}</h2>
          ${r.description ? html`<p class="description">${r.description}</p>` : nothing}

          <div class="stats">
            <span>${r.recipeIngredient.length} ingredients</span>
            <span>•</span>
            <span>${r.recipeInstructions.length} steps</span>
            ${r.recipeYield ? html`<span>•</span><span>${r.recipeYield}</span>` : nothing}
            <span>•</span>
            <span class="source">from ${r._recipebox.source_host}</span>
          </div>

          ${hasConflict ? this._renderConflict() : nothing}

          <div class="field">
            <label>Slug</label>
            <input
              type="text"
              .value=${this._editedSlug}
              @input=${(e: Event) =>
                (this._editedSlug = slugify((e.target as HTMLInputElement).value))}
            />
            <span class="field-hint">
              Folder name. Will be saved as <code>${this._editedSlug}/recipe.json</code>
            </span>
          </div>

          <div class="field">
            <label>Tags</label>
            <div class="tag-editor">
              ${this._editedTags.map(
                (t) => html`<span class="tag-chip">
                  ${t}
                  <button @click=${() => this._removeTag(t)} title="Remove tag">
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </span>`
              )}
              <input
                type="text"
                placeholder="Add tag..."
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    const target = e.target as HTMLInputElement;
                    this._addTag(target.value);
                    target.value = "";
                  }
                }}
              />
            </div>
            ${this.existingTags.length
              ? html`<div class="tag-suggestions">
                  ${this.existingTags
                    .filter((t) => !this._editedTags.includes(t))
                    .slice(0, 8)
                    .map(
                      (t) => html`<button class="suggestion" @click=${() => this._addTag(t)}>
                        + ${t}
                      </button>`
                    )}
                </div>`
              : nothing}
          </div>

          <div class="field">
            <label>Notes</label>
            <textarea
              rows="3"
              placeholder="Optional notes..."
              .value=${this._editedNotes}
              @input=${(e: Event) =>
                (this._editedNotes = (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>

          <details class="preview-details">
            <summary>Preview parsed content (${r.recipeIngredient.length} ingredients, ${r.recipeInstructions.length} steps)</summary>
            <h4>Ingredients</h4>
            <ul>
              ${r.recipeIngredient.map((i) => html`<li>${i}</li>`)}
            </ul>
            <h4>Instructions</h4>
            <ol>
              ${r.recipeInstructions.map((s) => html`<li>${s.text}</li>`)}
            </ol>
          </details>

          ${this._error
            ? html`<div class="error">
                <ha-icon icon="mdi:alert-circle"></ha-icon> ${this._error}
              </div>`
            : nothing}

          <div class="actions">
            <button @click=${() => (this._stage = "url")}>← Back</button>
            <button
              class="primary"
              ?disabled=${this._busy || !this._editedSlug}
              @click=${this._save}
            >
              ${this._busy ? "Saving..." : "Save recipe"}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderConflict(): TemplateResult {
    const c = this._preview!.conflicts;
    const message = c.url_already_imported
      ? `You've already imported this URL as "${c.url_already_imported}".`
      : `A recipe at slug "${c.slug_taken}" already exists.`;

    return html`
      <div class="conflict">
        <div class="conflict-header">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <span>${message}</span>
        </div>
        <div class="conflict-options">
          <label>
            <input
              type="radio"
              name="conflict"
              value="new_copy"
              .checked=${this._conflictMode === "new_copy"}
              @change=${() => (this._conflictMode = "new_copy")}
            />
            <div>
              <strong>Save as new copy</strong>
              <span>Adds a numeric suffix (e.g. <code>${c.slug_taken}-2</code>)</span>
            </div>
          </label>
          <label>
            <input
              type="radio"
              name="conflict"
              value="overwrite"
              .checked=${this._conflictMode === "overwrite"}
              @change=${() => (this._conflictMode = "overwrite")}
            />
            <div>
              <strong>Overwrite existing</strong>
              <span>Refresh content; preserves your tags, notes, and cook history</span>
            </div>
          </label>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .url-stage {
      padding: 32px 16px;
      max-width: 700px;
      margin: 0 auto;
    }
    .hint {
      color: var(--secondary-text-color);
      margin-bottom: 16px;
    }
    .mode-toggle {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      background: var(--secondary-background-color);
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
    }
    .mode-toggle button {
      background: transparent;
      border: 0;
      color: var(--secondary-text-color);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .mode-toggle button.active {
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .paste-hint {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin: 12px 0 8px;
      line-height: 1.5;
    }
    .paste-hint code {
      background: var(--secondary-background-color);
      padding: 1px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .html-paste {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: monospace;
      font-size: 0.85em;
      resize: vertical;
    }
    .paste-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .byte-count {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-right: auto;
    }
    .url-row {
      display: flex;
      gap: 8px;
    }
    .url-row input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 1em;
    }
    .url-row button,
    .actions button {
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-family: inherit;
      font-size: 1em;
    }
    .url-row .primary,
    .actions .primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .url-row button:disabled,
    .actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .review .hero {
      aspect-ratio: 16 / 9;
      background-size: cover;
      background-position: center;
    }
    .review .content {
      padding: 16px;
    }
    .review h2 {
      margin: 0 0 8px;
    }
    .description {
      color: var(--secondary-text-color);
      font-style: italic;
      margin: 0 0 16px;
    }
    .stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-bottom: 24px;
    }
    .conflict {
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .conflict-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--warning-color, #f59e0b);
    }
    .conflict-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .conflict-options label {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      align-items: flex-start;
    }
    .conflict-options label:hover {
      background: var(--secondary-background-color);
    }
    .conflict-options label > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .conflict-options span {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .field {
      margin-bottom: 20px;
    }
    .field label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .field input,
    .field textarea {
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 1em;
      box-sizing: border-box;
    }
    .field-hint {
      display: block;
      margin-top: 4px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .field-hint code {
      background: var(--secondary-background-color);
      padding: 1px 6px;
      border-radius: 3px;
    }
    .tag-editor {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
    }
    .tag-editor input {
      flex: 1;
      min-width: 120px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--primary-text-color);
    }
    .tag-chip {
      background: var(--primary-color);
      color: var(--text-primary-color);
      padding: 2px 4px 2px 10px;
      border-radius: 999px;
      font-size: 0.85em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .tag-chip button {
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      border-radius: 50%;
      display: inline-flex;
    }
    .tag-chip button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .tag-chip ha-icon {
      --mdc-icon-size: 14px;
    }
    .tag-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    .suggestion {
      background: transparent;
      border: 1px dashed var(--divider-color);
      color: var(--secondary-text-color);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.8em;
      cursor: pointer;
      font-family: inherit;
    }
    .preview-details {
      margin: 24px 0;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--secondary-background-color);
    }
    .preview-details summary {
      cursor: pointer;
      font-weight: 500;
    }
    .preview-details h4 {
      margin: 16px 0 8px;
    }
    .preview-details ul,
    .preview-details ol {
      padding-left: 20px;
      margin: 0;
    }
    .preview-details li {
      padding: 4px 0;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }
    .error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color);
      margin-top: 12px;
    }

    /* ---- File upload mode ---- */
    .file-drop {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 20px;
      border: 2px dashed var(--divider-color);
      border-radius: 12px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      text-align: center;
    }
    .file-drop:hover {
      border-color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    .file-drop ha-icon {
      --mdc-icon-size: 48px;
      color: var(--secondary-text-color);
    }
    .file-drop strong {
      display: block;
    }
    .file-drop .muted {
      display: block;
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-top: 2px;
    }
    .file-preview {
      position: relative;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--secondary-background-color);
    }
    .file-preview img {
      display: block;
      width: 100%;
      max-height: 320px;
      object-fit: contain;
    }
    .file-preview-pdf {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 16px;
    }
    .file-preview-pdf ha-icon {
      --mdc-icon-size: 40px;
      color: var(--error-color);
    }
    .file-preview-pdf .muted {
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }
    .file-preview .text-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
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
    .file-preview .text-btn ha-icon {
      --mdc-icon-size: 14px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "recipe-box-import-view": ImportView;
  }
}
