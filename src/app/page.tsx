import Link from "next/link";
import { getPublicEnv } from "@/lib/env";

export default function LandingPage() {
  const env = getPublicEnv();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--city-glow),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_40%)]" />
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-6 safe-pt">
        <div className="font-display text-xl font-semibold tracking-tight">CITYGRAM</div>
        <div className="flex gap-3 text-sm font-semibold">
          <Link href="/login" className="rounded-full px-4 py-2 text-muted hover:text-foreground">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-accent px-4 py-2 text-accent-foreground shadow-city"
          >
            Join
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-24 pt-10 md:flex-row md:items-center md:gap-16">
        <div className="flex-1 space-y-6">
          <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Geography is the product
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">
            Open your city first — <span className="text-accent">not the whole internet.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted">
            CITYGRAM anchors you in your home city: the feed, the voices, and the rhythm around you.
            When you travel elsewhere, you go on purpose — Passport Mode is a doorway, not a default.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-city"
            >
              Start in your city
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border px-6 text-sm font-semibold hover:bg-foreground/5"
            >
              I already have an account
            </Link>
          </div>
          {!env.supabaseConfigured && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Connect Supabase to unlock signup, storage, and the live city feeds.
            </p>
          )}
        </div>
        <div className="flex-1 rounded-3xl border border-border bg-card p-6 shadow-city">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted">Product rule</p>
          <ul className="mt-4 space-y-4 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
              Every account has a home city — it&apos;s not optional.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
              The default feed is always that home city — never a global firehose at startup.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-accent" />
              Other cities are destinations you choose — Passport Mode makes that feel like travel.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
