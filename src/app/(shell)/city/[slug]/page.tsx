import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/feed/post-card";
import { Avatar } from "@/components/media/avatar";
import {
  fetchCityBySlug,
  fetchCityEvents,
  fetchLocalBusinesses,
  fetchTrendingCreators,
  fetchTrendingPosts,
} from "@/lib/data/city-page";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

export default async function CityPulsePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const city = await fetchCityBySlug(supabase, slug);
  if (!city) notFound();

  const [trendingPosts, creators, businesses, events] = await Promise.all([
    fetchTrendingPosts(supabase, city.id, user.id, 6),
    fetchTrendingCreators(supabase, city.id, 6),
    fetchLocalBusinesses(supabase, city.id, 6),
    fetchCityEvents(supabase, city.id, 6),
  ]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-24">
      <header className="border-b border-border bg-gradient-to-b from-accent/10 to-background px-4 pb-8 pt-8 safe-pt">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">City pulse</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{city.name}</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">{city.tagline}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/passport/${city.slug}`}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-foreground shadow-city"
          >
            Open in Passport
          </Link>
          <Link
            href="/feed"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-semibold"
          >
            Back to home city feed
          </Link>
        </div>
      </header>

      <section className="space-y-3 px-4 py-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Trending posts</h2>
          <span className="text-xs text-muted">Ranked by energy</span>
        </div>
        <div className="space-y-4">
          {trendingPosts.length === 0 ? (
            <p className="text-sm text-muted">No momentum yet — seed a few posts to wake the block.</p>
          ) : (
            trendingPosts.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </div>
      </section>

      <section className="border-t border-border px-4 py-6">
        <h2 className="font-display text-xl font-semibold">Trending creators</h2>
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {creators.length === 0 ? (
            <p className="text-sm text-muted">Creators will appear as the scene grows.</p>
          ) : (
            creators.map((c) => (
              <Link
                key={c.id}
                href={`/u/${c.username}`}
                className="flex min-w-[140px] flex-col items-center gap-2 rounded-2xl border border-border bg-card px-3 py-4 text-center"
              >
                <Avatar src={c.avatar_url} alt={c.display_name} />
                <p className="text-sm font-semibold">{c.display_name}</p>
                <p className="text-xs text-muted">@{c.username}</p>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-border px-4 py-6">
        <h2 className="font-display text-xl font-semibold">Local businesses</h2>
        <div className="mt-4 space-y-3">
          {businesses.length === 0 ? (
            <p className="text-sm text-muted">Business profiles unlock as partners join the pilot.</p>
          ) : (
            businesses.map((b) => (
              <Link
                key={b.id}
                href={`/u/${b.username}`}
                className="flex min-h-[64px] items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{b.business_name}</p>
                  <p className="text-xs text-muted">{b.category ?? "Local favorite"}</p>
                </div>
                <span className="text-xs font-semibold text-accent">View</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-border px-4 py-6">
        <h2 className="font-display text-xl font-semibold">Local events</h2>
        <div className="mt-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-muted">Event posts stay lightweight until promoters connect.</p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                <p className="font-semibold">{ev.title}</p>
                <p className="text-xs text-muted">
                  {new Date(ev.starts_at).toLocaleString()} · {ev.venue_name ?? "Venue TBA"}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="border-t border-border px-4 py-8">
        <h2 className="font-display text-xl font-semibold">Local spotlight</h2>
        <p className="mt-2 text-sm text-muted">
          Sponsored neighborhood stories will appear here with a clear “Local spotlight” ribbon — the
          schema already reserves `is_sponsored_placeholder` on posts.
        </p>
      </section>
    </div>
  );
}
