import Link from "next/link";
import { PostCard } from "@/components/feed/post-card";
import { fetchCityFeed } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";

export default async function HomeCityFeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id, display_name")
    .eq("id", user.id)
    .single();

  if (!profile?.home_city_id) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted">
        Finish onboarding to unlock your city feed.
      </div>
    );
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id, name, slug, tagline")
    .eq("id", profile.home_city_id)
    .single();

  if (!city) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted">
        Finish onboarding to unlock your city feed.
      </div>
    );
  }

  const posts = await fetchCityFeed(supabase, profile.home_city_id, user.id);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-4">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-4 backdrop-blur safe-pt">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Home city</p>
            <h1 className="font-display text-2xl font-semibold">{city.name}</h1>
            <p className="text-sm text-muted">{city.tagline}</p>
          </div>
          <Link
            href="/passport"
            className="rounded-full border border-border px-3 py-2 text-xs font-semibold text-accent hover:bg-accent/10"
          >
            Passport
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted">
          This feed is scoped to <span className="font-semibold text-foreground">{city.name}</span>{" "}
          — your default world on CITYGRAM.
        </p>
      </header>

      <section className="divide-y divide-border">
        {posts.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted">
            <p>No posts here yet. Be the first voice from {city.name}.</p>
            <Link href="/create" className="mt-4 inline-block text-accent font-semibold">
              Create a post
            </Link>
          </div>
        ) : (
          posts.map((p) => <PostCard key={p.id} post={p} />)
        )}
      </section>
    </div>
  );
}
