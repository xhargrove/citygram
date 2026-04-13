import { getNormalizedSupabasePublicEnv } from "@/lib/supabase/public-env";

export function getPublicEnv() {
  const supabase = getNormalizedSupabasePublicEnv();
  return {
    supabaseConfigured: supabase !== null,
    supabaseUrl: supabase?.url ?? "",
    supabaseAnonKey: supabase?.key ?? "",
    appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").trim().replace(
      /^["']+|["']+$/g,
      ""
    ),
  };
}
