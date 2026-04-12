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
    .single();

  const city = await fetchCityBySlug(supabase, slug);
  if (!city) notFound();

  const posts = await fetchCityFeed(supabase, city.id, user.id);

  const { data: homeCity } = profile?.home_city_id
    ? await supabase.from("cities").select("name, slug").eq("id", profile.home_city_id).single()
    : { data: null };
  const home = homeCity;

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
          <div className="px-6 py-16 text-center text-sm text-muted">
            No public posts in {city.name} yet.
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </section>
    </div>
  );
}
