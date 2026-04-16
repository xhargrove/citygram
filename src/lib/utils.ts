import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Builds a profile username (letters, digits, underscore; max 30) from first and last name.
 * Used so the @handle reflects the member's name; collisions are resolved in onboarding.
 */
export function usernameSlugFromNames(first: string, last: string): string {
  const sanitize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

  const a = sanitize(first);
  const b = sanitize(last);
  let combined = [a, b].filter(Boolean).join("_");
  if (combined.length < 3) {
    combined = "member";
  }
  return combined.slice(0, 30);
}

export function parseHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  if (!matches) return [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

/**
 * Extracts @username tokens (ASCII letters, digits, underscore — matches profile username rules).
 * Deduped case-insensitively; order preserved by first occurrence.
 */
export function parseMentionUsernames(text: string): string[] {
  const re = /@([a-zA-Z0-9_]+)/g;
  const seen = new Set<string>();
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const lower = m[1].toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      out.push(lower);
    }
  }
  return out;
}

/** Fixed locale so server-rendered HTML matches the browser (avoids hydration mismatches). */
const DISPLAY_LOCALE = "en-US";

/** Short relative label for feed timestamps (e.g. "3h", "Jan 4"). */
export function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.round((Date.now() - t) / 1000);
  if (sec < 45) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(DISPLAY_LOCALE, { month: "short", day: "numeric" });
}

/** Full date/time for tooltips (same locale as SSR/client hydration). */
export function formatFullTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** City line for post metadata, e.g. "Atlanta, Georgia" when `region` exists in DB. */
export function formatCityWithRegion(city: { name: string; region: string | null }): string {
  const r = city.region?.trim();
  if (r) return `${city.name}, ${r}`;
  return city.name;
}

