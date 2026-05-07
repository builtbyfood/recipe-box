/**
 * Thin wrapper around the integration's HTTP API. All calls go through
 * `hass.callApi` so authentication is handled by HA.
 */
import type {
  HomeAssistant,
  PreviewResponse,
  Recipe,
  RecipeSummary,
  ShoppingPreviewResponse,
} from "../types.js";

export class RecipeBoxApi {
  constructor(private hass: HomeAssistant) {}

  preview(
    url: string,
    html?: string,
    text?: string
  ): Promise<PreviewResponse> {
    const body: { url: string; html?: string; text?: string } = { url };
    if (html) body.html = html;
    if (text) body.text = text;
    return this.hass.callApi("POST", "recipe_box/preview", body);
  }

  list(): Promise<RecipeSummary[]> {
    return this.hass.callApi("GET", "recipe_box/recipes");
  }

  get(slug: string): Promise<Recipe> {
    return this.hass.callApi("GET", `recipe_box/recipes/${slug}`);
  }

  save(
    recipe: Recipe,
    options: {
      slug?: string;
      on_conflict?: "error" | "overwrite" | "new_copy" | "skip";
      hero_url?: string;
    } = {}
  ): Promise<{ slug: string; recipe: Recipe }> {
    return this.hass.callApi("POST", "recipe_box/recipes", {
      recipe,
      ...options,
    });
  }

  update(slug: string, recipe: Recipe): Promise<{ slug: string; recipe: Recipe }> {
    return this.hass.callApi("PUT", `recipe_box/recipes/${slug}`, { recipe });
  }

  delete(slug: string): Promise<void> {
    return this.hass.callApi("DELETE", `recipe_box/recipes/${slug}`);
  }

  markCooked(slug: string): Promise<Recipe> {
    return this.hass.callApi("POST", `recipe_box/recipes/${slug}/cooked`);
  }

  shoppingPreview(
    slug: string,
    todo_entity: string,
    servings?: number,
    compact: boolean = true
  ): Promise<ShoppingPreviewResponse> {
    return this.hass.callApi(
      "POST",
      `recipe_box/recipes/${slug}/shopping_preview`,
      { todo_entity, servings, compact }
    );
  }

  /** Upload a PDF or image as a new recipe. */
  uploadFile(params: {
    name: string;
    file_b64: string;
    file_type: "pdf" | "image";
    filename: string;
    tags?: string[];
    notes?: string;
    on_conflict?: "error" | "overwrite" | "new_copy" | "skip";
  }): Promise<{ slug: string; recipe: Recipe }> {
    return this.hass.callApi("POST", "recipe_box/upload", params);
  }

  /** Get the URL to the attachment (auth still required). */
  attachmentUrl(slug: string): string {
    return `/api/recipe_box/recipes/${slug}/attachment`;
  }
}

export class RecipeBoxApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public payload?: unknown
  ) {
    super(message);
  }
}

/**
 * Extract a human-readable error message from whatever HA's callApi threw.
 *
 * HA's callApi throws structured objects, not Error instances. The shape
 * varies by HA version but is generally:
 *   { error: string, status_code: number, body: {...} }
 * where body may itself contain { message: string }.
 */
export function formatApiError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err !== "object" || err === null) return String(err);

  const obj = err as Record<string, unknown>;

  // HA 2024+ throws { error, status_code, body }
  if (typeof obj.body === "object" && obj.body !== null) {
    const body = obj.body as Record<string, unknown>;
    if (typeof body.message === "string") {
      const status = obj.status_code ? ` (HTTP ${obj.status_code})` : "";
      return body.message + status;
    }
  }

  // Some versions: { message: string }
  if (typeof obj.message === "string") return obj.message;

  // Last resort: stringify, but bail if it's circular
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
