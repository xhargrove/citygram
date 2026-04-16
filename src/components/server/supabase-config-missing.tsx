/**
 * Shown when NEXT_PUBLIC_SUPABASE_* is missing or invalid on the server.
 * Avoids throwing from createClient() and taking down RSC with an opaque digest.
 */
export function SupabaseConfigMissing() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-14">
      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-8 text-center shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-950 dark:text-amber-100">
          Configuration
        </p>
        <h1 className="mt-2 font-display text-xl font-semibold text-foreground">Supabase isn&apos;t wired on the server</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Set <code className="rounded bg-background px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-background px-1 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your
          host (e.g. Vercel → Project → Environment Variables), redeploy, and hard-refresh.
        </p>
      </div>
    </div>
  );
}
