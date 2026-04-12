"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let warnedAboutAnonKeyShape = false;

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    !warnedAboutAnonKeyShape &&
    !key.startsWith("eyJ")
  ) {
    warnedAboutAnonKeyShape = true;
    console.warn(
      "[CITYGRAM] NEXT_PUBLIC_SUPABASE_ANON_KEY should be the anon (public) JWT from Supabase " +
        "(Dashboard → Project Settings → API → Project API keys). It normally starts with eyJ. " +
        "Using a publishable sb_* key here often causes 400 errors on signInWithPassword. " +
        "Restart the dev server after changing .env.local."
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
