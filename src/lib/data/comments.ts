import type { SupabaseClient } from "@supabase/supabase-js";

export type CommentWithAuthor = {
  id: string;
  body: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export async function fetchComments(
  supabase: SupabaseClient,
  postId: string
): Promise<CommentWithAuthor[]> {
  const { data: rows } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (!rows?.length) return [];

  const authorIds = [...new Set(rows.map((r) => r.author_id))];
  const { data: authors } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", authorIds);

  const map = new Map((authors ?? []).map((a) => [a.id, a]));

  return rows.flatMap((r) => {
    const author = map.get(r.author_id);
    if (!author) return [];
    return [
      {
        id: r.id,
        body: r.body,
        created_at: r.created_at,
        author: author as CommentWithAuthor["author"],
      },
    ];
  });
}
