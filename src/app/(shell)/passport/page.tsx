import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CityRow } from "@/types/database";

export default async function PassportHubPage() {
  const supabase = await createClient();
  const { data: cities } = await supabase.from("cities").select("*").order("name");
  const list = (cities ?? []) as CityRow[];

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6 safe-pt">
      <header className="mb-8 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Passport</p>
        <h1 className="font-display text-3xl font-semibold">Travel on purpose</h1>
        <p className="text-sm leading-relaxed text-muted">
          Passport Mode opens another city&apos;s ecosystem — trending voices, local businesses, and
          events — without muting your home feed. Your default world stays rooted where you live.
        </p>
      </header>

      <section className="space-y-3">
        {list.map((city) => (
          <Link
            key={city.id}
            href={`/passport/${city.slug}`}
            className="flex min-h-[72px] flex-col justify-center rounded-2xl border border-border bg-card px-4 py-4 shadow-sm transition hover:border-accent/40"
          >
            <p className="font-display text-xl font-semibold">{city.name}</p>
            <p className="text-sm text-muted">{city.tagline}</p>
          </Link>
        ))}
      </section>

      <p className="mt-8 text-center text-xs text-muted">
        Looking for search? <Link href="/search" className="font-semibold text-accent">Open search</Link>
      </p>
    </div>
  );
}
