"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let warnedAboutAnonKeyShape = false;

/** Public client keys Supabase accepts (legacy JWT anon or platform publishable key). */
function looksLikePublicSupabaseKey(k: string): boolean {
  return k.startsWith("eyJ") || k.startsWith("sb_publishable_");
}

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
    !looksLikePublicSupabaseKey(key)
  ) {
    warnedAboutAnonKeyShape = true;
    console.warn(
      "[CITYGRAM] NEXT_PUBLIC_SUPABASE_ANON_KEY should be a public client key from Supabase " +
        "(Dashboard → Project Settings → API → API Keys): either the legacy anon JWT (starts with eyJ) " +
        "or the publishable key (starts with sb_publishable_). Do not use secret/service keys in the browser. " +
        "Restart the dev server after changing .env.local."
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
