"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function reportPost(postId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };
  const trimmed = reason.trim();
  if (trimmed.length < 3) return { error: "Add a short reason" };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    post_id: postId,
    reason: trimmed,
  });
  if (error) return { error: error.message };
  revalidatePath("/feed");
  revalidatePath(`/post/${postId}`);
  return { ok: true };
}

export async function moderateRemovePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    return { error: "Not allowed" };
  }

  const { error } = await supabase.from("posts").update({ is_removed: true }).eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/feed");
  revalidatePath("/admin");
  return { ok: true };
}

export async function moderateRemovePostAction(postId: string): Promise<void> {
  await moderateRemovePost(postId);
}
