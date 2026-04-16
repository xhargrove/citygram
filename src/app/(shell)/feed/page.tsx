import Link from "next/link";
import { CityPulseCard } from "@/components/feed/city-pulse-card";
import { ElsewhereOnCitygram } from "@/components/feed/elsewhere-on-citygram";
import { FeedActivityStrip } from "@/components/feed/feed-activity-strip";
import { HomeFeedList } from "@/components/feed/home-feed-list";
import { RecentVoices } from "@/components/feed/recent-voices";
import {
  EMPTY_CITY_PULSE_STATS,
  fetchCityPulseStats,
  fetchElsewhereActivity,
  fetchRecentVoicesInCity,
} from "@/lib/data/feed-activity";
import { SupabaseConfigMissing } from "@/components/server/supabase-config-missing";
import { fetchCityFeed } from "@/lib/data/posts";
import { logServerError } from "@/lib/server-log";
import { createClient } from "@/lib/supabase/server";

export default async function HomeCityFeedPage() {
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigMissing />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id, display_name")
    .eq("id", user.id)
    .maybeSingle();

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
    .maybeSingle();

  if (!city) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted">
        Finish onboarding to unlock your city feed.
      </div>
    );
  }

  const settled = await Promise.allSettled([
    fetchCityFeed(supabase, profile.home_city_id, user.id),
    fetchCityPulseStats(supabase, profile.home_city_id),
    fetchRecentVoicesInCity(supabase, profile.home_city_id),
    fetchElsewhereActivity(supabase, profile.home_city_id),
  ]);

  const posts = settled[0].status === "fulfilled" ? settled[0].value : [];
  if (settled[0].status === "rejected") {
    logServerError(
      "feed.fetchCityFeed",
      { cityId: profile.home_city_id, userId: user.id },
      settled[0].reason
    );
  }

  const pulse =
    settled[1].status === "fulfilled" ? settled[1].value : EMPTY_CITY_PULSE_STATS;
  if (settled[1].status === "rejected") {
    logServerError("feed.fetchCityPulseStats", { cityId: profile.home_city_id }, settled[1].reason);
  }

  const recentVoices = settled[2].status === "fulfilled" ? settled[2].value : [];
  if (settled[2].status === "rejected") {
    logServerError(
      "feed.fetchRecentVoicesInCity",
      { cityId: profile.home_city_id },
      settled[2].reason
    );
  }

  const elsewhere = settled[3].status === "fulfilled" ? settled[3].value : [];
  if (settled[3].status === "rejected") {
    logServerError("feed.fetchElsewhereActivity", { cityId: profile.home_city_id }, settled[3].reason);
  }

  const feedPartialFailure =
    settled[0].status === "rejected" ||
    settled[1].status === "rejected" ||
    settled[2].status === "rejected" ||
    settled[3].status === "rejected";

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-4">
      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/70 px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.05)] backdrop-blur-xl backdrop-saturate-150 safe-pt dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted">Your city</p>
            <h1 className="citygram-gradient-text font-display text-2xl font-semibold tracking-tight md:text-[1.75rem]">
              {city.name}
            </h1>
            {city.tagline && (
              <p className="mt-0.5 text-sm text-muted">{city.tagline}</p>
            )}
          </div>
          <Link
            href="/passport"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent shadow-sm transition hover:border-accent/45 hover:bg-accent/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 opacity-90" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M12 7v3.5l2 2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Passport
          </Link>
        </div>
        <p className="mt-3 border-l-2 border-accent/35 pl-3 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-foreground">{city.name}</span> is where you start on CITYGRAM — local
          first, not a generic timeline.
        </p>
      </header>

      {feedPartialFailure ? (
        <p className="mx-4 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-950 dark:text-amber-100">
          Some feed data didn&apos;t load. Refresh the page or try again in a moment — your connection or the service may
          have hiccuped.
        </p>
      ) : null}

      <section className="space-y-4 px-4 pt-4">
        <FeedActivityStrip
          cityName={city.name}
          postsTodayUtc={pulse.postsTodayUtc}
          distinctPostersTodayUtc={pulse.distinctPostersTodayUtc}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CityPulseCard cityName={city.name} stats={pulse} />
          <RecentVoices cityName={city.name} voices={recentVoices} />
        </div>
        <ElsewhereOnCitygram cities={elsewhere} />
      </section>

      <section>
        {posts.length === 0 ? (
          <div className="citygram-lift mx-4 mt-6 rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/50 px-5 py-10 text-center shadow-city dark:from-card/50 dark:to-card/30">
            <p className="font-display text-xl font-semibold text-foreground">
              Be one of the first voices in {city.name}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Your city is getting started — there aren&apos;t posts in the feed yet. One honest photo or video gives
              neighbors something to gather around.
            </p>
            {elsewhere.length > 0 && (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Other cities on CITYGRAM already have public activity — explore anytime, then come back home to post.
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-city"
              >
                Create a post
              </Link>
              <Link
                href="/explore"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground"
              >
                Explore active cities
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted">
              You always post to <span className="font-medium text-foreground">{city.name}</span>. Use Passport to
              browse other cities without changing where you publish.
            </p>
          </div>
        ) : (
          <HomeFeedList initialPosts={posts} cityName={city.name} />
        )}
      </section>
    </div>
  );
}

