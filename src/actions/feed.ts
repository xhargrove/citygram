"use server";

import { createClient } from "@/lib/supabase/server";
import { CITY_FEED_PAGE_SIZE, fetchCityFeed } from "@/lib/data/posts";
import { logServerError } from "@/lib/server-log";
import type { PostWithAuthor } from "@/types/database";

export async function loadMoreHomeFeedPosts(offset: number): Promise<{
  posts: PostWithAuthor[];
  done: boolean;
}> {
  if (!Number.isInteger(offset) || offset < 0) {
    const err = new Error("loadMoreHomeFeedPosts: invalid offset");
    logServerError("loadMoreHomeFeedPosts.invalid_offset", { offset, route: "/feed" }, err);
    return { posts: [], done: true };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { posts: [], done: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { posts: [], done: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.home_city_id) {
    return { posts: [], done: true };
  }

  const posts = await fetchCityFeed(
    supabase,
    profile.home_city_id,
    user.id,
    CITY_FEED_PAGE_SIZE,
    offset
  );

  return {
    posts,
    done: posts.length < CITY_FEED_PAGE_SIZE,
  };
}
