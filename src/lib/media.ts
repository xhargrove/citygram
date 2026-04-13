import { getNormalizedSupabasePublicEnv } from "@/lib/supabase/public-env";

export function storagePublicUrl(storagePath: string): string {
  const env = getNormalizedSupabasePublicEnv();
  if (!env) return "";
  return `${env.url}/storage/v1/object/public/post-media/${storagePath}`;
}

/** Returns the object path inside `post-media` for a public bucket URL, or null if not ours. */
export function extractPostMediaStoragePathFromPublicUrl(fullUrl: string): string | null {
  const marker = "/storage/v1/object/public/post-media/";
  const idx = fullUrl.indexOf(marker);
  if (idx === -1) return null;
  const rest = fullUrl.slice(idx + marker.length).split("?")[0];
  try {
    return decodeURIComponent(rest);
  } catch {
    return null;
  }
}
