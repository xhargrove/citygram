import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CityRow } from "@/types/database";

export default async function ExploreCitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id")
    .eq("id", user.id)
    .single();

  const homeId = profile?.home_city_id;

  const { data: cities } = await supabase.from("cities").select("*").order("name");

  const list = (cities ?? []) as CityRow[];

  const suggested = homeId ? list.filter((c) => c.id !== homeId).slice(0, 4) : list.slice(0, 4);
  const nearby = list.filter((c) => c.id !== homeId).slice(0, 6);

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6 safe-pt">
      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Explore</p>
        <h1 className="font-display text-3xl font-semibold">Choose your next city</h1>
        <p className="text-sm text-muted">
          Your feed always opens at home. This screen is for intentional travel — Passport Mode keeps
          the context feeling like a trip, not a toggle.
        </p>
        <Link
          href="/search"
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold"
        >
          Search cities, people, tags…
        </Link>
      </header>

      <section className="mb-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested</h2>
        <div className="grid gap-3">
          {suggested.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Nearby cities (pilot)
        </h2>
        <p className="text-xs text-muted">
          V2: geo-ranked neighbors. For launch, we surface the full roster so no city feels empty.
        </p>
        <div className="grid gap-3">
          {nearby.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CityCard({ city }: { city: CityRow }) {
  return (
    <Link
      href={`/passport/${city.slug}`}
      className="flex min-h-[72px] items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-accent/40"
    >
      <div>
        <p className="font-display text-lg font-semibold">{city.name}</p>
        <p className="text-xs text-muted">
          {city.region}, {city.country}
        </p>
      </div>
      <span className="text-sm font-semibold text-accent">Travel →</span>
    </Link>
  );
}
