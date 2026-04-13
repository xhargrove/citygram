import { getNormalizedSupabasePublicEnv } from "@/lib/supabase/public-env";

export function storagePublicUrl(storagePath: string): string {
  const env = getNormalizedSupabasePublicEnv();
  if (!env) return "";
  return `${env.url}/storage/v1/object/public/post-media/${storagePath}`;
}
