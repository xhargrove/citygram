/**
 * Normalize Supabase public env for browser, server, and Edge middleware.
 * Trims whitespace and strips wrapping quotes (common copy/paste mistakes in Vercel).
 * Validates a full http(s) URL so @supabase/supabase-js does not throw "Invalid supabaseUrl".
 */
export function getNormalizedSupabasePublicEnv(): { url: string; key: string } | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (rawUrl == null || rawKey == null) return null;

  const url = rawUrl.trim().replace(/^["']+|["']+$/g, "");
  const key = rawKey.trim().replace(/^["']+|["']+$/g, "");
  if (!url || !key) return null;

  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return { url, key };
  } catch {
    return null;
  }
}
