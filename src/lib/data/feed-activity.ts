import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types/database";

/** Start of current UTC calendar day (ISO). Used consistently for “today” metrics. */
export function utcDayStartIso(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

const ROLLUP_ROW_CAP = 4000;

export type CityPulseStats = {
  postsTodayUtc: number;
  distinctPostersTodayUtc: number;
  /** Distinct neighborhoods represented in today’s posts; omitted from UI if 0. */
  neighborhoodsActiveTodayUtc: number;
};

/** Safe defaults when pulse queries fail (network/RLS); keeps the feed shell rendering. */
export const EMPTY_CITY_PULSE_STATS: CityPulseStats = {
  postsTodayUtc: 0,
  distinctPostersTodayUtc: 0,
  neighborhoodsActiveTodayUtc: 0,
};

/**
 * Aggregates for the home-city pulse card. All “today” values use the UTC calendar day
 * (same boundary as the database `timestamptz` comparisons below).
 */
export async function fetchCityPulseStats(
  supabase: SupabaseClient,
  cityId: string
): Promise<CityPulseStats> {
  const since = utcDayStartIso();

  const [{ count: postsTodayUtc }, { data: rollupRows }] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("city_id", cityId)
      .eq("is_removed", false)
      .gte("created_at", since),
    supabase
      .from("posts")
      .select("author_id, neighborhood_id")
      .eq("city_id", cityId)
      .eq("is_removed", false)
      .gte("created_at", since)
      .limit(ROLLUP_ROW_CAP),
  ]);

  const rows = rollupRows ?? [];
  const authors = new Set(rows.map((r) => r.author_id));
  const hoods = new Set(rows.map((r) => r.neighborhood_id).filter(Boolean));

  return {
    postsTodayUtc: postsTodayUtc ?? 0,
    distinctPostersTodayUtc: authors.size,
    neighborhoodsActiveTodayUtc: hoods.size,
  };
}

export type RecentVoice = {
  profile: Pick<ProfileRow, "id" | "username" | "display_name" | "avatar_url">;
  lastPostAt: string;
  postsThisWeekUtc: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_POST_SCAN = 120;
const RECENT_VOICE_CAP = 6;

/**
 * Recent distinct posters in the city, ordered by most recent post. Weekly counts are computed
 * from posts in the last 7 UTC days for that city (cheap bounded scan).
 */
export async function fetchRecentVoicesInCity(
  supabase: SupabaseClient,
  cityId: string
): Promise<RecentVoice[]> {
  const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();

  const { data: recentPosts } = await supabase
    .from("posts")
    .select("author_id, created_at")
    .eq("city_id", cityId)
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(RECENT_POST_SCAN);

  if (!recentPosts?.length) return [];

  const seen = new Set<string>();
  const orderedAuthors: { authorId: string; lastPostAt: string }[] = [];
  for (const row of recentPosts) {
    if (seen.has(row.author_id)) continue;
    seen.add(row.author_id);
    orderedAuthors.push({ authorId: row.author_id, lastPostAt: row.created_at });
    if (orderedAuthors.length >= RECENT_VOICE_CAP) break;
  }

  const authorIds = orderedAuthors.map((a) => a.authorId);
  const [{ data: profiles }, { data: weekPosts }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", authorIds),
    supabase
      .from("posts")
      .select("author_id")
      .eq("city_id", cityId)
      .eq("is_removed", false)
      .gte("created_at", weekAgo)
      .in("author_id", authorIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p as Pick<ProfileRow, "id" | "username" | "display_name" | "avatar_url">]));
  const weekCount = new Map<string, number>();
  for (const r of weekPosts ?? []) {
    weekCount.set(r.author_id, (weekCount.get(r.author_id) ?? 0) + 1);
  }

  return orderedAuthors
    .map((o) => {
      const profile = profileMap.get(o.authorId);
      if (!profile) return null;
      return {
        profile,
        lastPostAt: o.lastPostAt,
        postsThisWeekUtc: weekCount.get(o.authorId) ?? 0,
      };
    })
    .filter(Boolean) as RecentVoice[];
}

export type ElsewhereCity = {
  cityId: string;
  slug: string;
  name: string;
  postsLast24h: number;
};

const ELSEWHERE_SAMPLE = 350;
const ELSEWHERE_MAX_CITIES = 4;

/**
 * Other cities with recent public posts (last 24h), excluding `excludeCityId`.
 * Ranked by volume; requires enough distinct posts in the sample to surface signal.
 */
export async function fetchElsewhereActivity(
  supabase: SupabaseClient,
  excludeCityId: string
): Promise<ElsewhereCity[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: rows } = await supabase
    .from("posts")
    .select("city_id")
    .eq("is_removed", false)
    .gte("created_at", since)
    .neq("city_id", excludeCityId)
    .limit(ELSEWHERE_SAMPLE);

  if (!rows?.length) return [];

  const tally = new Map<string, number>();
  for (const r of rows) {
    tally.set(r.city_id, (tally.get(r.city_id) ?? 0) + 1);
  }

  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, ELSEWHERE_MAX_CITIES);
  if (top.length === 0) return [];

  const ids = top.map(([id]) => id);
  const { data: cities } = await supabase.from("cities").select("id, slug, name").in("id", ids);
  const cityMap = new Map((cities ?? []).map((c) => [c.id, c]));

  const exactCounts = await Promise.all(
    ids.map((cityId) =>
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("city_id", cityId)
        .eq("is_removed", false)
        .gte("created_at", since)
    )
  );

  return ids
    .map((cityId, i) => {
      const c = cityMap.get(cityId);
      const postsLast24h = exactCounts[i]?.count ?? 0;
      if (!c || postsLast24h === 0) return null;
      return {
        cityId: c.id,
        slug: c.slug,
        name: c.name,
        postsLast24h,
      };
    })
    .filter(Boolean) as ElsewhereCity[];
}
