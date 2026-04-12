"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { POST_LIMITS, countHashtagTokens } from "@/lib/post-limits";
import { createClient } from "@/lib/supabase/server";
import { parseHashtags, parseMentionUsernames } from "@/lib/utils";
import type { FinalizeCreatePostInput } from "@/types/post-create";

export type CreatePostState = { error?: string; ok?: boolean; postId?: string };

const DRAFT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPathUnderDraft(userId: string, draftId: string, storagePath: string): boolean {
  const prefix = `${userId}/draft/${draftId}/`;
  if (!storagePath.startsWith(prefix)) return false;
  if (storagePath.includes("..")) return false;
  const rest = storagePath.slice(prefix.length);
  if (!rest || rest.includes("/")) return false;
  return true;
}

async function rollbackCreatedPost(supabase: SupabaseClient, postId: string, storagePaths: string[]) {
  if (storagePaths.length > 0) {
    await supabase.storage.from("post-media").remove(storagePaths);
  }
  await supabase.from("posts").delete().eq("id", postId);
}

/**
 * Creates `posts` + `post_media` after media was uploaded client-direct to Storage.
 * Validates auth, caption/hashtag/media limits, and that paths belong to this user + draft.
 * Resolves @mentions into `post_tagged_profiles` and sends in-app notifications.
 */
export async function finalizeCreatePost(input: FinalizeCreatePostInput): Promise<CreatePostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  if (!DRAFT_ID_RE.test(input.draft_id)) {
    return { error: "Invalid draft reference" };
  }

  const caption = input.caption.trim();
  const cityId = input.city_id.trim();
  const neighborhoodId =
    typeof input.neighborhood_id === "string" && input.neighborhood_id.length > 0
      ? input.neighborhood_id
      : null;

  if (!cityId) return { error: "City is required" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.home_city_id) return { error: "Complete onboarding first" };

  if (caption.length > POST_LIMITS.captionMaxChars) {
    return { error: `Caption is limited to ${POST_LIMITS.captionMaxChars} characters.` };
  }
  if (countHashtagTokens(caption) > POST_LIMITS.maxHashtagTokens) {
    return { error: `Use at most ${POST_LIMITS.maxHashtagTokens} hashtags in the caption.` };
  }

  const mentionUsernames = parseMentionUsernames(caption);
  if (mentionUsernames.length > POST_LIMITS.maxMentionUsernames) {
    return { error: `Use at most ${POST_LIMITS.maxMentionUsernames} @mentions per post.` };
  }

  const media = [...input.media].sort((a, b) => a.sort_order - b.sort_order);
  if (media.length === 0) return { error: "Add at least one photo or video" };
  if (media.length > POST_LIMITS.maxMediaItems) {
    return { error: `You can attach up to ${POST_LIMITS.maxMediaItems} files per post.` };
  }

  const totalBytes = media.reduce((s, m) => s + m.byte_size, 0);
  if (totalBytes > POST_LIMITS.maxMediaBytesTotal) {
    return { error: "Total upload size is too large for this post." };
  }

  for (const m of media) {
    if (m.media_type !== "image" && m.media_type !== "video") {
      return { error: "Invalid media type" };
    }
    if (!isPathUnderDraft(user.id, input.draft_id, m.storage_path)) {
      return { error: "Invalid media path" };
    }
  }

  const hashtags = parseHashtags(caption);

  const { data: post, error: postErr } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      city_id: cityId,
      neighborhood_id: neighborhoodId,
      caption: caption.length ? caption : null,
      hashtags,
    })
    .select("id")
    .single();

  if (postErr || !post) return { error: postErr?.message ?? "Could not create post" };

  const storagePaths = media.map((m) => m.storage_path);
  const rows = media.map((m) => ({
    post_id: post.id,
    storage_path: m.storage_path,
    media_type: m.media_type,
    sort_order: m.sort_order,
  }));

  const { error: mediaErr } = await supabase.from("post_media").insert(rows);
  if (mediaErr) {
    await rollbackCreatedPost(supabase, post.id, storagePaths);
    return { error: mediaErr.message };
  }

  if (mentionUsernames.length > 0) {
    const { data: resolved } = await supabase
      .from("profiles")
      .select("id, username_lower")
      .in("username_lower", mentionUsernames);

    const taggedIds = [
      ...new Set(
        (resolved ?? [])
          .map((p) => p.id)
          .filter((id) => id !== user.id)
      ),
    ];

    if (taggedIds.length > 0) {
      const tagRows = taggedIds.map((tagged_profile_id) => ({
        post_id: post.id,
        tagged_profile_id,
      }));

      const { error: tagErr } = await supabase.from("post_tagged_profiles").insert(tagRows);
      if (tagErr) {
        await rollbackCreatedPost(supabase, post.id, storagePaths);
        return { error: tagErr.message };
      }

      const notifRows = taggedIds.map((recipient_id) => ({
        recipient_id,
        actor_id: user.id,
        type: "mention" as const,
        post_id: post.id,
      }));

      const { error: notifErr } = await supabase.from("notifications").insert(notifRows);
      if (notifErr) {
        await rollbackCreatedPost(supabase, post.id, storagePaths);
        return { error: notifErr.message };
      }
    }
  }

  revalidatePath("/feed");
  revalidatePath(`/city/`);
  return { ok: true, postId: post.id };
}
