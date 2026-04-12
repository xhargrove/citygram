import type { SupabaseClient } from "@supabase/supabase-js";
import type { PostRow } from "@/types/database";

export type PublicProfile = {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  home_city_id: string | null;
  neighborhood_id: string | null;
  account_type: string;
  city: { id: string; name: string; slug: string } | null;
  neighborhood: { id: string; name: string } | null;
};

export async function fetchPublicProfile(
  supabase: SupabaseClient,
  username: string
): Promise<PublicProfile | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username_lower", username.toLowerCase())
    .maybeSingle();

  if (!profile) return null;

  const [{ data: city }, { data: hood }] = await Promise.all([
    profile.home_city_id
      ? supabase.from("cities").select("id, name, slug").eq("id", profile.home_city_id).single()
      : Promise.resolve({ data: null }),
    profile.neighborhood_id
      ? supabase.from("neighborhoods").select("id, name").eq("id", profile.neighborhood_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    home_city_id: profile.home_city_id,
    neighborhood_id: profile.neighborhood_id,
    account_type: profile.account_type,
    city: city as PublicProfile["city"],
    neighborhood: hood as PublicProfile["neighborhood"],
  };
}

export type PostThumb = {
  postId: string;
  storage_path: string | null;
  media_type: "image" | "video" | null;
};

function mapFirstMedia(
  postIds: string[],
  media: { post_id: string; storage_path: string; media_type: string }[] | null
): PostThumb[] {
  const first = new Map<string, { storage_path: string; media_type: "image" | "video" }>();
  for (const m of media ?? []) {
    if (!first.has(m.post_id)) {
      first.set(m.post_id, {
        storage_path: m.storage_path,
        media_type: m.media_type as "image" | "video",
      });
    }
  }
  return postIds.map((id) => ({
    postId: id,
    storage_path: first.get(id)?.storage_path ?? null,
    media_type: first.get(id)?.media_type ?? null,
  }));
}

export async function fetchPostThumbnailsForIds(
  supabase: SupabaseClient,
  postIds: string[]
): Promise<PostThumb[]> {
  if (!postIds.length) return [];
  const { data: media } = await supabase
    .from("post_media")
    .select("post_id, storage_path, media_type, sort_order")
    .in("post_id", postIds)
    .order("sort_order", { ascending: true });
  return mapFirstMedia(postIds, media ?? []);
}

export async function fetchProfilePostThumbs(
  supabase: SupabaseClient,
  profileId: string
): Promise<PostThumb[]> {
  const posts = await fetchProfilePosts(supabase, profileId);
  if (!posts.length) return [];

  const ids = posts.map((p) => p.id);
  const { data: media } = await supabase
    .from("post_media")
    .select("post_id, storage_path, media_type, sort_order")
    .in("post_id", ids)
    .order("sort_order", { ascending: true });

  return mapFirstMedia(ids, media ?? []);
}

export async function fetchProfilePosts(
  supabase: SupabaseClient,
  profileId: string
): Promise<Pick<PostRow, "id" | "caption" | "created_at">[]> {
  const { data } = await supabase
    .from("posts")
    .select("id, caption, created_at")
    .eq("author_id", profileId)
    .eq("is_removed", false)
    .order("created_at", { ascending: false });

  return (data ?? []) as Pick<PostRow, "id" | "caption" | "created_at">[];
}

export async function fetchSavedPosts(
  supabase: SupabaseClient,
  viewerId: string
): Promise<Pick<PostRow, "id" | "caption" | "created_at">[]> {
  const { data: saves } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("profile_id", viewerId)
    .order("created_at", { ascending: false })
    .limit(60);

  if (!saves?.length) return [];

  const ids = saves.map((s) => s.post_id);
  const { data: posts } = await supabase
    .from("posts")
    .select("id, caption, created_at")
    .in("id", ids)
    .eq("is_removed", false);

  const order = new Map(ids.map((id, i) => [id, i]));
  return (posts ?? [])
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)) as Pick<
    PostRow,
    "id" | "caption" | "created_at"
  >[];
}

export async function fetchTaggedPosts(
  supabase: SupabaseClient,
  profileId: string
): Promise<Pick<PostRow, "id" | "caption" | "created_at">[]> {
  const { data: tags } = await supabase
    .from("post_tagged_profiles")
    .select("post_id")
    .eq("tagged_profile_id", profileId);

  if (!tags?.length) return [];

  const ids = tags.map((t) => t.post_id);
  const { data: posts } = await supabase
    .from("posts")
    .select("id, caption, created_at")
    .in("id", ids)
    .eq("is_removed", false);

  return (posts ?? []) as Pick<PostRow, "id" | "caption" | "created_at">[];
}

export async function fetchFollowCounts(
  supabase: SupabaseClient,
  profileId: string
): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profileId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
  ]);

  return { followers: followers ?? 0, following: following ?? 0 };
}

export async function isFollowing(
  supabase: SupabaseClient,
  viewerId: string,
  targetId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", viewerId)
    .eq("following_id", targetId)
    .maybeSingle();

  return Boolean(data);
}
