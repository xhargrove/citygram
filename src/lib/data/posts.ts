import type { SupabaseClient } from "@supabase/supabase-js";
import type { CityRow, PostMediaRow, PostRow, ProfileRow, PostWithAuthor } from "@/types/database";

export async function fetchCityFeed(
  supabase: SupabaseClient,
  cityId: string,
  viewerId: string,
  limit = 30
): Promise<PostWithAuthor[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .eq("city_id", cityId)
    .eq("is_removed", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !posts?.length) {
    return [];
  }

  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [{ data: authors }, { data: city }, { data: mediaRows }, { data: likes }, { data: saves }] =
    await Promise.all([
      supabase.from("profiles").select("id, username, display_name, avatar_url").in("id", authorIds),
      supabase.from("cities").select("id, slug, name").eq("id", cityId).single(),
      supabase.from("post_media").select("*").in("post_id", postIds),
      supabase.from("likes").select("post_id").eq("profile_id", viewerId).in("post_id", postIds),
      supabase.from("saved_posts").select("post_id").eq("profile_id", viewerId).in("post_id", postIds),
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

  const cityRow = city as Pick<CityRow, "id" | "slug" | "name"> | null;

  return posts.map((row) => {
    const author = authorMap.get(row.author_id);
    if (!author || !cityRow) {
      return null;
    }
    return {
      ...(row as PostRow),
      author: {
        id: author.id,
        username: author.username,
        display_name: author.display_name,
        avatar_url: author.avatar_url,
      },
      city: cityRow,
      media: mediaByPost.get(row.id) ?? [],
      liked_by_me: liked.has(row.id),
      saved_by_me: saved.has(row.id),
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

  const [{ data: author }, { data: city }, { data: mediaRows }, { data: likeRow }, { data: saveRow }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .eq("id", row.author_id)
        .single(),
      supabase.from("cities").select("id, slug, name").eq("id", row.city_id).single(),
      supabase.from("post_media").select("*").eq("post_id", postId).order("sort_order"),
      supabase.from("likes").select("post_id").eq("post_id", postId).eq("profile_id", viewerId).maybeSingle(),
      supabase.from("saved_posts").select("post_id").eq("post_id", postId).eq("profile_id", viewerId).maybeSingle(),
    ]);

  if (!author || !city) return null;

  const media = (mediaRows ?? []) as PostMediaRow[];

  return {
    ...(row as PostRow),
    author: author as PostWithAuthor["author"],
    city: city as PostWithAuthor["city"],
    media,
    liked_by_me: Boolean(likeRow),
    saved_by_me: Boolean(saveRow),
  };
}
