import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CityRow,
  NeighborhoodRow,
  PostMediaRow,
  PostRow,
  ProfileRow,
  PostWithAuthor,
} from "@/types/database";

/** Default page size for city-scoped feeds (home, passport, etc.). */
export const CITY_FEED_PAGE_SIZE = 20;

type TaggedProfile = Pick<ProfileRow, "id" | "username" | "display_name">;

async function fetchTaggedProfilesByPostIds(
  supabase: SupabaseClient,
  postIds: string[]
): Promise<Map<string, TaggedProfile[]>> {
  const map = new Map<string, TaggedProfile[]>();
  if (postIds.length === 0) return map;

  const { data: links } = await supabase
    .from("post_tagged_profiles")
    .select("post_id, tagged_profile_id")
    .in("post_id", postIds);

  if (!links?.length) return map;

  const profileIds = [...new Set(links.map((l) => l.tagged_profile_id))];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", profileIds);

  const pmap = new Map((profs ?? []).map((p) => [p.id, p as TaggedProfile]));
  for (const l of links) {
    const p = pmap.get(l.tagged_profile_id);
    if (!p) continue;
    const list = map.get(l.post_id) ?? [];
    list.push(p);
    map.set(l.post_id, list);
  }
  return map;
}

export async function fetchCityFeed(
  supabase: SupabaseClient,
  cityId: string,
  viewerId: string,
  limit: number = CITY_FEED_PAGE_SIZE,
  offset = 0
): Promise<PostWithAuthor[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("city_id", cityId)
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`fetchCityFeed: ${error.message}`);
  }
  if (!posts?.length) {
    return [];
  }

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];
  const neighborhoodIds = [...new Set(posts.map((p) => p.neighborhood_id).filter(Boolean))] as string[];

  const [
    { data: authors },
    { data: city },
    { data: mediaRows },
    { data: likes },
    { data: saves },
    { data: neighborhoodRows },
    taggedByPost,
  ] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", authorIds),
    supabase.from("cities").select("id, slug, name, region").eq("id", cityId).single(),
    supabase.from("post_media").select("*").in("post_id", postIds),
    supabase.from("likes").select("post_id").eq("profile_id", viewerId).in("post_id", postIds),
    supabase.from("saved_posts").select("post_id").eq("profile_id", viewerId).in("post_id", postIds),
    neighborhoodIds.length > 0
      ? supabase.from("neighborhoods").select("id, name").in("id", neighborhoodIds)
      : Promise.resolve({ data: [] as Pick<NeighborhoodRow, "id" | "name">[] }),
    fetchTaggedProfilesByPostIds(supabase, postIds),
  ]);

  const authorMap = new Map((authors ?? []).map((a) => [a.id, a as ProfileRow]));
  const mediaByPost = new Map<string, PostMediaRow[]>();
  for (const m of mediaRows ?? []) {
    const row = m as PostMediaRow;
    const list = mediaByPost.get(row.post_id) ?? [];
    list.push(row);
    mediaByPost.set(row.post_id, list);
  }
  for (const [, list] of mediaByPost) {
    list.sort((a, b) => a.sort_order - b.sort_order);
  }

  const liked = new Set(likes?.map((l) => l.post_id));
  const saved = new Set(saves?.map((s) => s.post_id));

  const cityRow = city as Pick<CityRow, "id" | "slug" | "name" | "region"> | null;
  const neighborhoodMap = new Map(
    (neighborhoodRows ?? []).map((n) => [n.id, n as Pick<NeighborhoodRow, "id" | "name">])
  );

  return posts.map((row) => {
    const author = authorMap.get(row.author_id);
    if (!author || !cityRow) {
      return null;
    }
    const hoodId = row.neighborhood_id;
    return {
      ...(row as PostRow),
      author: {
        id: author.id,
        username: author.username,
        display_name: author.display_name,
        avatar_url: author.avatar_url,
      },
      city: cityRow,
      neighborhood: hoodId ? neighborhoodMap.get(hoodId) ?? null : null,
      media: mediaByPost.get(row.id) ?? [],
      liked_by_me: liked.has(row.id),
      saved_by_me: saved.has(row.id),
      tagged_profiles: taggedByPost.get(row.id) ?? [],
    } as PostWithAuthor;
  }).filter(Boolean) as PostWithAuthor[];
}

export async function fetchPostById(
  supabase: SupabaseClient,
  postId: string,
  viewerId: string
): Promise<PostWithAuthor | null> {
  const { data: row, error } = await supabase.from("posts").select("*").eq("id", postId).maybeSingle();

  if (error || !row || row.is_removed) return null;

  const [{ data: author }, { data: city }, { data: mediaRows }, { data: likeRow }, { data: saveRow }, { data: hood }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", row.author_id)
        .maybeSingle(),
      supabase.from("cities").select("id, slug, name, region").eq("id", row.city_id).single(),
      supabase.from("post_media").select("*").eq("post_id", postId).order("sort_order"),
      supabase.from("likes").select("post_id").eq("post_id", postId).eq("profile_id", viewerId).maybeSingle(),
      supabase.from("saved_posts").select("post_id").eq("post_id", postId).eq("profile_id", viewerId).maybeSingle(),
      row.neighborhood_id
        ? supabase.from("neighborhoods").select("id, name").eq("id", row.neighborhood_id).maybeSingle()
        : Promise.resolve({ data: null as Pick<NeighborhoodRow, "id" | "name"> | null }),
    ]);

  if (!author || !city) return null;

  const media = (mediaRows ?? []) as PostMediaRow[];
  const taggedMap = await fetchTaggedProfilesByPostIds(supabase, [postId]);

  return {
    ...(row as PostRow),
    author: author as PostWithAuthor["author"],
    city: city as PostWithAuthor["city"],
    neighborhood: (hood as Pick<NeighborhoodRow, "id" | "name"> | null) ?? null,
    media,
    liked_by_me: Boolean(likeRow),
    saved_by_me: Boolean(saveRow),
    tagged_profiles: taggedMap.get(postId) ?? [],
  };
}
