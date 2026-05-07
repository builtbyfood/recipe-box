/**
 * Type definitions for the Recipe Box card.
 *
 * Recipes follow schema.org Recipe shape with a single underscore-namespaced
 * extension `_recipebox` for our metadata. See ha-recipe-box/docs/SCHEMA.md
 * for the full reference.
 */

export interface HowToStep {
  "@type": "HowToStep";
  text: string;
  name?: string;
  image?: string;
}

export interface NutritionInformation {
  "@type": "NutritionInformation";
  calories?: string;
  fatContent?: string;
  carbohydrateContent?: string;
  proteinContent?: string;
  [key: string]: string | undefined;
}

export interface RecipeBoxMeta {
  source_url: string;
  source_host: string;
  /** Origin of the recipe content. Defaults to "web" for legacy recipes. */
  source_type?: "web" | "pdf" | "image";
  /** Filename of the attached document, if source_type is pdf or image. */
  source_file?: string | null;
  suggested_slug: string;
  tags: string[];
  notes: string;
  last_cooked: string | null;
  cooked_count: number;
  imported_at: string | null;
  schema_version: number;
}

export interface Recipe {
  "@context": "https://schema.org";
  "@type": "Recipe";
  name: string;
  description?: string;
  image?: string;
  author?: string;
  datePublished?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string;
  recipeCategory?: string;
  recipeCuisine?: string;
  recipeIngredient: string[];
  recipeInstructions: HowToStep[];
  nutrition?: NutritionInformation;
  _recipebox: RecipeBoxMeta;
}

/** Compact representation returned by GET /recipes (the library listing). */
export interface RecipeSummary {
  slug: string;
  name: string;
  image?: string;
  totalTime?: string;
  recipeYield?: string;
  recipeCategory?: string;
  tags: string[];
  last_cooked: string | null;
  cooked_count: number;
  imported_at?: string | null;
  source_host?: string;
  source_type?: "web" | "pdf" | "image";
  has_hero: boolean;
  ingredients_text?: string;
}

export type SortBy =
  | "name"
  | "imported"
  | "last_cooked"
  | "cooked_count"
  | "total_time";

export type ViewMode = "grid" | "list";

export type QuickFilter = "never" | "quick" | "recent" | "favorite";

export interface PreviewResponse {
  recipe: Recipe;
  conflicts: {
    slug_taken?: string;
    existing_at_slug?: RecipeSummary;
    url_already_imported?: string;
    existing_by_url?: RecipeSummary;
  };
  existing_tags: string[];
}

export interface ShoppingPreviewItem {
  /** What gets sent to the list (compact form when compact=true) */
  text: string;
  /** Original ingredient line as written in the recipe */
  original?: string;
  /** Scaled ingredient line (after multiplier applied) */
  scaled?: string;
  already_on_list: boolean;
  matched_item: string | null;
}

export interface ShoppingPreviewResponse {
  items: ShoppingPreviewItem[];
  current_list_items: string[];
  multiplier: number;
  base_yield: number | null;
  todo_entity: string;
  compact?: boolean;
}

export type CardView = "library" | "detail" | "cook" | "import";

export type GroupBy = "none" | "tag" | "category" | "source";

export interface RecipeBoxCardConfig {
  type: string;
  view?: CardView;
  /** For detail/cook view: which recipe to show. May reference a state. */
  recipe_id?: string;
  /** For library view: layout density. */
  columns?: number;
  /** Whether to show the tag filter sidebar (desktop only). */
  show_filters?: boolean;
  /** Initial grouping mode for the library. User can override at runtime. */
  group_by?: GroupBy;
  /** Default todo entity for "send to list" actions. */
  default_todo?: string;
  /** Title shown above the card. */
  title?: string;
}

/** HA hass object — minimal shape we need. */
export interface HomeAssistant {
  states: Record<string, { state: string; attributes: Record<string, unknown> }>;
  callApi<T = unknown>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    path: string,
    parameters?: Record<string, unknown>
  ): Promise<T>;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id?: string | string[] }
  ): Promise<unknown>;
  user?: { name: string; id: string };
}
