"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Not found" };

  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("likes").delete().eq("post_id", postId).eq("profile_id", user.id);
  } else {
    await supabase.from("likes").insert({ post_id: postId, profile_id: user.id });
    if (post.author_id !== user.id) {
      await supabase.from("notifications").insert({
        recipient_id: post.author_id,
        actor_id: user.id,
        type: "like",
        post_id: postId,
      });
    }
  }

  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function toggleSave(postId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: existing } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_posts").delete().eq("post_id", postId).eq("profile_id", user.id);
  } else {
    await supabase.from("saved_posts").insert({ post_id: postId, profile_id: user.id });
  }

  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  revalidatePath(`/u/`);
  return { ok: true };
}

export async function addComment(postId: string, body: string) {
  const text = body.trim();
  if (text.length < 1 || text.length > 2000) {
    return { error: "Invalid comment" };
  }
  const supabase = await createClient();
  if (!supabase) return { error: "Unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { error: "Not found" };

  await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body: text,
  });

  if (post.author_id !== user.id) {
    await supabase.from("notifications").insert({
      recipient_id: post.author_id,
      actor_id: user.id,
      type: "comment",
      post_id: postId,
    });
  }

  revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function toggleFollow(targetUsername: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Unavailable" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username_lower", targetUsername.toLowerCase())
    .maybeSingle();
  if (!target || target.id === user.id) return { error: "Invalid" };

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", target.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", target.id);
    await supabase
      .from("notifications")
      .delete()
      .eq("recipient_id", target.id)
      .eq("actor_id", user.id)
      .eq("type", "follow")
      .is("post_id", null);
  } else {
    await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: target.id,
    });
    await supabase.from("notifications").insert({
      recipient_id: target.id,
      actor_id: user.id,
      type: "follow",
      post_id: null,
    });
  }

  revalidatePath(`/u/${targetUsername}`);
  revalidatePath("/notifications");
  return { ok: true };
}

export async function recordShare(postId: string) {
  const supabase = await createClient();
  if (!supabase) return { error: "Unavailable" };

  const { error } = await supabase.rpc("increment_post_share", { p_post_id: postId });
  if (error) return { error: error.message };
  revalidatePath(`/post/${postId}`);
  return { ok: true };
}
