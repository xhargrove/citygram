import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getNormalizedSupabasePublicEnv } from "@/lib/supabase/public-env";

export async function createClient() {
  const cookieStore = await cookies();
  const env = getNormalizedSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Missing or invalid NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(URL must be a full https address, e.g. https://xxxx.supabase.co)"
    );
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
