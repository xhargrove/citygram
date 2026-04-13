import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import { fetchCityBySlug } from "@/lib/data/city-page";
import { fetchCityFeed } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export default async function PassportCityPage({ params }: Props) {
  const { slug } = await params;
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

  const city = await fetchCityBySlug(supabase, slug);
  if (!city) notFound();

  const posts = await fetchCityFeed(supabase, city.id, user.id, 30);

  const { data: homeCity } = profile?.home_city_id
    ? await supabase.from("cities").select("name, slug").eq("id", profile.home_city_id).single()
    : { data: null };
  const home = homeCity;
  const isHomeCity = Boolean(profile?.home_city_id && profile.home_city_id === city.id);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-6">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur safe-pt">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Passport</p>
            <h1 className="font-display text-2xl font-semibold">{city.name}</h1>
            <p className="text-xs text-muted">You&apos;re visiting another city ecosystem.</p>
          </div>
          <Link href="/feed" className="text-xs font-semibold text-muted">
            Home feed
          </Link>
        </div>
        {home && (
          <p className="mt-3 rounded-2xl bg-accent/10 px-3 py-2 text-xs text-foreground">
            Home base still set to <span className="font-semibold">{home.name}</span> — this view does
            not replace your default feed.
          </p>
        )}
      </header>

      <section className="divide-y divide-border">
        {posts.length === 0 ? (
          <div className="mx-4 my-6 rounded-2xl border border-border bg-card/60 px-5 py-10 text-center shadow-sm">
            <p className="font-display text-xl font-semibold text-foreground">
              Nothing public in {city.name} yet
            </p>
            {isHomeCity ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  You&apos;re viewing your home city in Passport — the feed is empty until someone posts. Start
                  the thread or come back later.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/create"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-city"
                  >
                    Create a post
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold"
                  >
                    Browse other cities
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Passport is for watching <span className="font-medium text-foreground">{city.name}</span>. New
                  posts always publish to your home city
                  {home ? (
                    <>
                      {" "}
                      (<span className="font-medium text-foreground">{home.name}</span>)
                    </>
                  ) : null}
                  .
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/create"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-city"
                  >
                    Create at home
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold"
                  >
                    Browse other cities
                  </Link>
                </div>
              </>
            )}
          </div>
        ) : (
          posts.map((p, i) => <PostCard key={p.id} post={p} priorityImage={i === 0} />)
        )}
      </section>
    </div>
  );
}
