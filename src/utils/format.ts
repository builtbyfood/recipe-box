/** Helper utilities — duration formatting, slug generation, etc. */

/**
 * Convert ISO 8601 duration like "PT25M" or "PT1H30M" to a human string.
 * Returns empty string for null/undefined/invalid.
 */
export function formatDuration(iso?: string | null): string {
  if (!iso) return "";
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return "";
  const hours = parseInt(m[1] || "0", 10);
  const mins = parseInt(m[2] || "0", 10);
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  if (mins) return `${mins}m`;
  return "";
}

/**
 * Parse "PT25M" to total minutes (for timer.start integration).
 * Returns null if parsing fails.
 */
export function parseDurationMinutes(iso?: string | null): number | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!m) return null;
  const hours = parseInt(m[1] || "0", 10);
  const mins = parseInt(m[2] || "0", 10);
  const total = hours * 60 + mins;
  return total || null;
}

/**
 * Detect a duration mentioned in a step like "bake for 25 minutes" so
 * cook mode can offer a timer button. Returns minutes or null.
 */
export function extractStepDuration(text: string): number | null {
  // "25 minutes", "1 hour 30 minutes", "1 hr", "5 min", "15-20 minutes" (use lower bound)
  const range = text.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);
  if (range) {
    const v = parseInt(range[1], 10);
    return /h/i.test(range[3]) ? v * 60 : v;
  }
  let total = 0;
  const hours = text.match(/(\d+)\s*(?:hr|hour|hours)/i);
  if (hours) total += parseInt(hours[1], 10) * 60;
  const mins = text.match(/(\d+)\s*(?:min|minute|minutes)/i);
  if (mins) total += parseInt(mins[1], 10);
  return total || null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "recipe";
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "never";
  const now = Date.now();
  const diff = (now - then) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w ago`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}mo ago`;
  return `${Math.floor(diff / (86400 * 365))}y ago`;
}
