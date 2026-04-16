import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getNormalizedSupabasePublicEnv } from "@/lib/supabase/public-env";

/**
 * Server Supabase client. Returns `null` when public env is missing or invalid — **does not throw**
 * (throwing here took down entire RSC trees in production with only a digest in the browser).
 */
export async function createClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies();
  const env = getNormalizedSupabasePublicEnv();
  if (!env) {
    console.error(
      "[citygram] createClient: missing or invalid NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(URL must be https, e.g. https://xxxx.supabase.co)"
    );
    return null;
  }
  const { url, key } = env;

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component — ignore if read-only */
        }
      },
    },
  });
}
