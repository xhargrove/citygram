"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractPostMediaStoragePathFromPublicUrl, storagePublicUrl } from "@/lib/media";

export type ProfileAvatarState = { error?: string; ok?: boolean };

function isValidAvatarPathForUser(userId: string, storagePath: string): boolean {
  const n = storagePath.trim().replace(/^\/+|\/+$/g, "");
  if (n.includes("..") || !n.startsWith(`${userId}/avatar/`)) return false;
  return true;
}

export async function updateProfileAvatar(storagePath: string): Promise<ProfileAvatarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  const normalized = storagePath.trim().replace(/^\/+|\/+$/g, "");
  if (!isValidAvatarPathForUser(user.id, normalized)) {
    return { error: "Invalid upload path" };
  }

  const publicUrl = storagePublicUrl(normalized);
  if (!publicUrl) return { error: "Server configuration error" };

  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);
  if (upErr) return { error: upErr.message };

  if (before?.avatar_url) {
    const oldPath = extractPostMediaStoragePathFromPublicUrl(before.avatar_url);
    if (oldPath && oldPath !== normalized && oldPath.startsWith(`${user.id}/avatar/`)) {
      await supabase.storage.from("post-media").remove([oldPath]);
    }
  }

  const { data: row } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  revalidatePath("/settings");
  if (row?.username) {
    revalidatePath(`/u/${row.username}`);
    revalidatePath("/feed");
    revalidatePath("/explore");
  }

  return { ok: true };
}

export async function clearProfileAvatar(): Promise<ProfileAvatarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  const { data: before } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { error: upErr } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (upErr) return { error: upErr.message };

  if (before?.avatar_url) {
    const oldPath = extractPostMediaStoragePathFromPublicUrl(before.avatar_url);
    if (oldPath?.startsWith(`${user.id}/avatar/`)) {
      await supabase.storage.from("post-media").remove([oldPath]);
    }
  }

  const { data: row } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  revalidatePath("/settings");
  if (row?.username) {
    revalidatePath(`/u/${row.username}`);
    revalidatePath("/feed");
  }

  return { ok: true };
}
