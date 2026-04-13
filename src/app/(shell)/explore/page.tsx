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
    .maybeSingle();

  const homeId = profile?.home_city_id;

  const { data: cities } = await supabase.from("cities").select("*").order("name");

  const list = (cities ?? []) as CityRow[];

  const suggested = homeId ? list.filter((c) => c.id !== homeId).slice(0, 4) : list.slice(0, 4);
  const nearby = list.filter((c) => c.id !== homeId).slice(0, 6);
  const noOtherCities = suggested.length === 0 && nearby.length === 0;

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6 safe-pt">
      <header className="mb-6 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Explore</p>
        <h1 className="font-display text-3xl font-semibold">Other cities</h1>
        <p className="text-sm text-muted">
          Tap a place to open it in Passport — look around on purpose. Your home feed stays where you
          anchored at signup.
        </p>
        <Link
          href="/search"
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-foreground/5"
        >
          Search cities, people, tags…
        </Link>
      </header>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-5 py-10 text-center">
          <p className="font-display text-lg font-semibold text-foreground">No cities in the directory yet</p>
          <p className="mt-2 text-sm text-muted">
            Explore fills in automatically once cities exist in your project — the app isn&apos;t broken,
            the roster is just empty.
          </p>
        </div>
      ) : noOtherCities ? (
        <div className="rounded-2xl border border-border bg-card/60 px-5 py-10 text-center shadow-sm">
          <p className="font-display text-xl font-semibold text-foreground">Other cities aren&apos;t listed yet</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            When more metros exist beside your home city, they&apos;ll list here. Until then, post at home and search
            still works everywhere.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/create"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-city"
            >
              Create a post
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold"
            >
              Search people &amp; tags
            </Link>
            <Link href="/feed" className="text-sm font-semibold text-accent">
              ← Home city feed
            </Link>
          </div>
        </div>
      ) : (
        <>
          <section className="mb-8 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Beyond home</h2>
            <div className="grid gap-3">
              {suggested.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Directory</h2>
            <p className="text-xs text-muted">Every metro you can open — distance ranking comes later.</p>
            <div className="grid gap-3">
              {nearby.map((city) => (
                <CityCard key={`nearby-${city.id}`} city={city} />
              ))}
            </div>
          </section>
        </>
      )}
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
      <span className="text-sm font-semibold text-accent">Visit →</span>
    </Link>
  );
}
