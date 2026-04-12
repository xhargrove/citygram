"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseHashtags } from "@/lib/utils";

export type CreatePostState = { error?: string; ok?: boolean; postId?: string };

export async function createPost(_prev: CreatePostState, formData: FormData): Promise<CreatePostState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in required" };

  const caption = String(formData.get("caption") ?? "").trim();
  const cityId = String(formData.get("city_id") ?? "");
  const neighborhoodIdRaw = formData.get("neighborhood_id");
  const neighborhoodId =
    typeof neighborhoodIdRaw === "string" && neighborhoodIdRaw.length > 0
      ? neighborhoodIdRaw
      : null;

  if (!cityId) return { error: "City is required" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id")
    .eq("id", user.id)
    .single();
  if (!profile?.home_city_id) return { error: "Complete onboarding first" };

  const files = formData.getAll("media") as File[];
  const validFiles = files.filter((f) => f instanceof File && f.size > 0);
  if (validFiles.length === 0) return { error: "Add at least one photo or video" };

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

  const bucket = supabase.storage.from("post-media");

  for (let i = 0; i < validFiles.length; i++) {
    const file = validFiles[i];
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${post.id}/${i}.${ext}`;
    const upload = await bucket.upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
    if (upload.error) {
      await supabase.from("posts").delete().eq("id", post.id);
      return { error: upload.error.message };
    }

    const mediaType = file.type.startsWith("video") ? "video" : "image";
    await supabase.from("post_media").insert({
      post_id: post.id,
      storage_path: path,
      media_type: mediaType,
      sort_order: i,
    });
  }

  revalidatePath("/feed");
  revalidatePath(`/city/`);
  return { ok: true, postId: post.id };
}
