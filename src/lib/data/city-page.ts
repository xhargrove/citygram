import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostWithAuthor } from "@/types/database";
import { fetchCityFeed } from "@/lib/data/posts";

export async function fetchCityBySlug(supabase: SupabaseClient, slug: string) {
  const { data } = await supabase.from("cities").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function fetchTrendingCreators(supabase: SupabaseClient, cityId: string, limit = 8) {
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, account_type")
    .eq("home_city_id", cityId)
    .eq("account_type", "creator")
    .limit(limit);

  return data ?? [];
}

export async function fetchLocalBusinesses(supabase: SupabaseClient, cityId: string, limit = 8) {
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("home_city_id", cityId)
    .eq("account_type", "business")
    .limit(limit);

  if (!profiles?.length) return [];

  const ids = profiles.map((p) => p.id);
  const { data: businesses } = await supabase
    .from("business_profiles")
    .select("profile_id, business_name, category")
    .in("profile_id", ids);

  const map = new Map((businesses ?? []).map((b) => [b.profile_id, b]));

  return profiles.map((p) => ({
    ...p,
    business_name: map.get(p.id)?.business_name ?? p.display_name,
    category: map.get(p.id)?.category ?? null,
  }));
}

export async function fetchCityEvents(supabase: SupabaseClient, cityId: string, limit = 8) {
  const { data } = await supabase
    .from("events")
    .select("id, title, starts_at, venue_name, cover_image_url")
    .eq("city_id", cityId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(limit);

  return data ?? [];
}

export async function fetchTrendingPosts(
  supabase: SupabaseClient,
  cityId: string,
  viewerId: string,
  limit = 8
): Promise<PostWithAuthor[]> {
  const feed = await fetchCityFeed(supabase, cityId, viewerId, 60);
  return [...feed].sort((a, b) => b.like_count - a.like_count).slice(0, limit);
}
