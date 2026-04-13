import Link from "next/link";
import { CitygramLogo } from "@/components/brand/citygram-logo";
import { getPublicEnv } from "@/lib/env";

// ─── Static city preview data ─────────────────────────────────────────────────
const CITIES = [
  {
    slug: "atlanta",
    name: "Atlanta",
    tagline: "ATL on the move",
    stat: "12.4k posts this week",
    color: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-400",
  },
  {
    slug: "austin",
    name: "Austin",
    tagline: "Keep it weird, keep it local",
    stat: "9.1k posts this week",
    color: "bg-teal-50 text-teal-900 border-teal-200",
    dot: "bg-teal-400",
  },
  {
    slug: "portland",
    name: "Portland",
    tagline: "PDX knows",
    stat: "7.8k posts this week",
    color: "bg-rose-50 text-rose-900 border-rose-200",
    dot: "bg-rose-400",
  },
  {
    slug: "st-louis",
    name: "St. Louis",
    tagline: "River city, brick & blues",
    stat: "6.2k posts this week",
    color: "bg-indigo-50 text-indigo-900 border-indigo-200",
    dot: "bg-indigo-400",
  },
  {
    slug: "jackson-ms",
    name: "Jackson",
    tagline: "Capital city, Southern soul",
    stat: "4.1k posts this week",
    color: "bg-emerald-50 text-emerald-900 border-emerald-200",
    dot: "bg-emerald-500",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Pick your city",
    body: "Your home city is your world. Every post, every conversation — grounded in place.",
  },
  {
    n: "02",
    title: "Follow your neighborhood",
    body: "Zoom in. The block you live on, the park you run in, the spot everyone knows.",
  },
  {
    n: "03",
    title: "Travel with your Passport",
    body: "Visiting somewhere? Flip to Passport mode and see the city through local eyes.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const env = getPublicEnv();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-md safe-pt">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2" aria-label="CITYGRAM home">
            <CitygramLogo size={28} priority />
            <span className="text-sm font-semibold tracking-tight">CITYGRAM</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Marketing">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 active:scale-95"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-20 md:pt-28">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/10 px-3 py-1 text-xs font-medium text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Now live in Atlanta · Austin · Portland · St. Louis · Jackson, MS
            </p>

            {/* Headline */}
            <h1 className="mb-6 font-display text-5xl font-bold leading-[1.08] tracking-tight md:text-6xl lg:text-7xl">
              Your city,{" "}
              <span className="font-normal italic">not the internet.</span>
            </h1>

            {/* Sub */}
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-muted">
              CITYGRAM is a social network where your home city is the default world — not an
              algorithm&apos;s guess at what you might like. Local posts, local people, local pulse.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-foreground px-6 py-3 text-base font-semibold text-background transition-opacity hover:opacity-90 active:scale-95"
              >
                Claim your city →
              </Link>
              <Link
                href="/explore"
                className="rounded-xl border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/10"
              >
                Explore cities
              </Link>
            </div>

            {!env.supabaseConfigured && (
              <p className="mt-6 text-sm text-amber-700 dark:text-amber-300">
                Connect Supabase to unlock signup, storage, and the live city feeds.
              </p>
            )}
          </div>
        </section>

        {/* ── City cards ──────────────────────────────────────────────────── */}
        <section className="border-y border-border/50 bg-muted/5 py-14 dark:bg-muted/10">
          <div className="mx-auto max-w-5xl px-5">
            <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-muted">
              Live cities
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {CITIES.map((city) => (
                <div key={city.slug} className={`rounded-2xl border p-5 ${city.color}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${city.dot}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      {city.name}
                    </span>
                  </div>
                  <p className="mb-4 text-xl font-bold leading-snug">{city.tagline}</p>
                  <p className="text-xs opacity-60">{city.stat}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-5 py-20">
          <p className="mb-12 text-xs font-semibold uppercase tracking-widest text-muted">
            How it works
          </p>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n}>
                <p className="mb-3 font-mono text-3xl font-bold text-border">{step.n}</p>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Passport callout ────────────────────────────────────────────── */}
        <section className="border-t border-border/50 bg-foreground text-background">
          <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-50">
                  Passport mode
                </p>
                <h2 className="mb-4 text-3xl font-bold leading-snug md:text-4xl">
                  Visiting somewhere?
                  <br />
                  See it like a local.
                </h2>
                <p className="text-base leading-relaxed opacity-70">
                  Flip to Passport and browse any city&apos;s live feed — events, spots,
                  conversations — without losing your home city.
                </p>
              </div>
              <Link
                href="/signup"
                className="shrink-0 rounded-xl border border-background/30 px-6 py-3 text-base font-semibold text-background transition-colors hover:bg-background/10"
              >
                Get your Passport →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-5 py-20 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Your city is waiting.</h2>
          <p className="mx-auto mb-8 max-w-md text-base text-muted">
            Be the first voice in your neighborhood. Help build the local layer the internet was
            missing.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-foreground px-8 py-3.5 text-base font-semibold text-background transition-opacity hover:opacity-90 active:scale-95"
          >
            Join CITYGRAM →
          </Link>
          <p className="mt-4 text-xs text-muted">
            Free to join · No algorithm · Your city first
          </p>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 safe-pb">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CitygramLogo size={24} />
            <span className="text-xs font-semibold tracking-tight text-muted">CITYGRAM</span>
          </div>
          <p className="text-xs text-muted">
            City-first social · Original product · Not affiliated with any other platform
          </p>
        </div>
      </footer>
    </div>
  );
}
