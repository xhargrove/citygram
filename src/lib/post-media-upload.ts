import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinalizeMediaItem } from "@/types/post-create";

function safeExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,10}$/i.test(fromName)) return fromName;
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/heif-sequence"
  ) {
    return "heic";
  }
  if (file.type.startsWith("video/")) return "mp4";
  return "jpg";
}

function mediaTypeForFile(file: File): "image" | "video" {
  return file.type.startsWith("video/") ? "video" : "image";
}

function contentTypeForUpload(file: File, ext: string): string | undefined {
  if (file.type) return file.type;
  if (ext === "heic" || ext === "heif") return "image/heic";
  return undefined;
}

/**
 * Uploads selected files to `post-media` under `{userId}/draft/{draftId}/…`.
 * Matches storage RLS: first path segment must be the authenticated user's id.
 */
export async function uploadDraftMediaToStorage(
  supabase: SupabaseClient,
  userId: string,
  draftId: string,
  files: File[]
): Promise<{ items: FinalizeMediaItem[]; paths: string[] }> {
  const bucket = supabase.storage.from("post-media");
  const items: FinalizeMediaItem[] = [];
  const paths: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = safeExt(file);
    const path = `${userId}/draft/${draftId}/${i}.${ext}`;
    const upload = await bucket.upload(path, file, {
      upsert: false,
      contentType: contentTypeForUpload(file, ext),
    });
    if (upload.error) {
      if (paths.length > 0) {
        await bucket.remove(paths);
      }
      throw new Error(upload.error.message);
    }
    paths.push(path);
    items.push({
      storage_path: path,
      media_type: mediaTypeForFile(file),
      byte_size: file.size,
      sort_order: i,
    });
  }

  return { items, paths };
}
