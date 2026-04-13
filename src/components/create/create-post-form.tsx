"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeCreatePost } from "@/actions/post";
import { uploadDraftMediaToStorage } from "@/lib/post-media-upload";
import { createClient } from "@/lib/supabase/client";
import type { NeighborhoodRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { POST_LIMITS, countHashtagTokens } from "@/lib/post-limits";
import { cn, parseMentionUsernames } from "@/lib/utils";

type Props = {
  homeCityId: string;
  homeCityName: string;
  defaultNeighborhoodId: string | null;
};

type Phase = "idle" | "uploading" | "finalizing";

/** Include MIME + extensions so OS pickers offer iPhone/macOS HEIC/HEIF (not only generic image/*). */
const ACCEPT = "image/*,image/heic,image/heif,video/*,.heic,.heif";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isAllowedFile(file: File): boolean {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^(jpe?g|png|gif|webp|heic|heif)$/i.test(ext)) return true;
  if (/^(mp4|webm|mov|m4v)$/i.test(ext)) return true;
  return false;
}

/** Use image thumbnail preview when we can safely show one with an img element. */
function isImagePreview(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (file.type.startsWith("video/")) return false;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return /^(jpe?g|png|gif|webp|heic|heif)$/i.test(ext);
}

function videoTypeLabel(file: File): string {
  if (file.type && file.type.startsWith("video/")) {
    return file.type.replace("video/", "").toUpperCase() || "Video";
  }
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "VIDEO";
  return ext;
}

function totalBytes(files: File[]): number {
  return files.reduce((s, f) => s + f.size, 0);
}

export function CreatePostForm({ homeCityId, homeCityName, defaultNeighborhoodId }: Props) {
  const router = useRouter();
  const [hoods, setHoods] = useState<NeighborhoodRow[]>([]);
  const [neighborhoodId, setNeighborhoodId] = useState(defaultNeighborhoodId ?? "");
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const mediaFieldId = `${formId}-media`;

  const objectUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => {
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [objectUrls]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("neighborhoods")
      .select("*")
      .eq("city_id", homeCityId)
      .order("name")
      .then(({ data }) => setHoods((data as NeighborhoodRow[]) ?? []));
  }, [homeCityId]);

  useEffect(() => {
    setNeighborhoodId((prev) => {
      if (!prev) return "";
      return hoods.some((h) => h.id === prev) ? prev : "";
    });
  }, [homeCityId, hoods]);

  const totalSize = totalBytes(files);
  const hashtagCount = countHashtagTokens(caption);
  const mentionCount = parseMentionUsernames(caption).length;
  const captionOk = caption.length <= POST_LIMITS.captionMaxChars;
  const hashtagsOk = hashtagCount <= POST_LIMITS.maxHashtagTokens;
  const mentionsOk = mentionCount <= POST_LIMITS.maxMentionUsernames;
  const canSubmit =
    files.length > 0 &&
    files.length <= POST_LIMITS.maxMediaItems &&
    totalSize <= POST_LIMITS.maxMediaBytesTotal &&
    files.every(isAllowedFile) &&
    captionOk &&
    hashtagsOk &&
    mentionsOk;

  const busy = phase !== "idle";

  function tryAddFiles(incoming: File[]) {
    setClientError(null);
    if (incoming.length === 0) return;
    const allowedIncoming = incoming.filter(isAllowedFile);
    if (allowedIncoming.length < incoming.length) {
      setClientError("Only image and video files are supported.");
    }
    if (allowedIncoming.length === 0) return;
    const merged = [...files, ...allowedIncoming];
    if (merged.length > POST_LIMITS.maxMediaItems) {
      setClientError(`You can add up to ${POST_LIMITS.maxMediaItems} files.`);
      return;
    }
    const t = totalBytes(merged);
    if (t > POST_LIMITS.maxMediaBytesTotal) {
      setClientError(
        `Total size must be ${formatBytes(POST_LIMITS.maxMediaBytesTotal)} or less (this would be ${formatBytes(t)}).`
      );
      return;
    }
    setFiles(merged);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    tryAddFiles(picked);
  }

  function removeAt(index: number) {
    setClientError(null);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    if (files.length === 0) {
      setClientError("Add at least one photo or video.");
      return;
    }
    if (files.length > POST_LIMITS.maxMediaItems) {
      setClientError(`You can add up to ${POST_LIMITS.maxMediaItems} files.`);
      return;
    }
    if (!files.every(isAllowedFile)) {
      setClientError("Only image and video files are supported.");
      return;
    }
    const t = totalBytes(files);
    if (t > POST_LIMITS.maxMediaBytesTotal) {
      setClientError(`Total size must be ${formatBytes(POST_LIMITS.maxMediaBytesTotal)} or less.`);
      return;
    }
    if (caption.length > POST_LIMITS.captionMaxChars) {
      setClientError(`Caption is limited to ${POST_LIMITS.captionMaxChars} characters.`);
      return;
    }
    if (countHashtagTokens(caption) > POST_LIMITS.maxHashtagTokens) {
      setClientError(`Use at most ${POST_LIMITS.maxHashtagTokens} hashtags in the caption.`);
      return;
    }
    if (parseMentionUsernames(caption).length > POST_LIMITS.maxMentionUsernames) {
      setClientError(`Use at most ${POST_LIMITS.maxMentionUsernames} @mentions in the caption.`);
      return;
    }

    const publishNeighborhoodId = neighborhoodId.trim().length > 0 ? neighborhoodId.trim() : null;

    const supabase = createClient();
    let uploadedPaths: string[] = [];
    let step: "upload" | "finalize" = "upload";

    try {
      setPhase("uploading");
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr || !user) {
        setClientError("Sign in required.");
        setPhase("idle");
        return;
      }

      const draftId = crypto.randomUUID();
      const { items, paths } = await uploadDraftMediaToStorage(supabase, user.id, draftId, files);
      uploadedPaths = paths;

      step = "finalize";
      setPhase("finalizing");

      const res = await finalizeCreatePost({
        caption,
        city_id: homeCityId,
        neighborhood_id: publishNeighborhoodId,
        draft_id: draftId,
        media: items,
      });

      if (res.error) {
        await supabase.storage.from("post-media").remove(uploadedPaths);
        setClientError(`Could not publish: ${res.error}`);
        setPhase("idle");
        return;
      }
      if (res.ok && res.postId) {
        router.replace(`/post/${res.postId}`);
        router.refresh();
        return;
      }

      await supabase.storage.from("post-media").remove(uploadedPaths);
      setClientError("Could not publish: unknown error.");
      setPhase("idle");
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("post-media").remove(uploadedPaths);
      }
      const raw = err instanceof Error ? err.message : "Something went wrong.";
      setClientError(step === "upload" ? `Upload failed: ${raw}` : `Could not publish: ${raw}`);
      setPhase("idle");
    }
  }

  const errorText = clientError;
  const disabled = busy;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto max-w-lg space-y-6 px-4 py-6 safe-pt safe-pb"
      aria-busy={busy}
      aria-describedby={busy ? `${formId}-publishing-status` : undefined}
      noValidate
    >
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Create</p>
        <h1 className="font-display text-2xl font-semibold">Share a moment</h1>
        <p className="text-sm text-muted">
          Upload straight to storage, then publish. This goes to the city you call home — the same place as your feed.
          Captions and tags follow sensible limits; uploads stay web-friendly in size.
        </p>
      </header>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your post belongs to</p>
        <div
          className="flex min-h-12 items-center rounded-xl border border-border bg-card/80 px-4 text-sm font-medium text-foreground"
          aria-readonly
        >
          {homeCityName}
          <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide text-muted">Home</span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`${formId}-hood`}>
          Neighborhood (optional)
        </label>
        <select
          id={`${formId}-hood`}
          name="neighborhood_id"
          value={neighborhoodId}
          onChange={(e) => setNeighborhoodId(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-sm"
          disabled={disabled}
        >
          <option value="">None</option>
          {hoods.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`${formId}-caption`}>
            Caption
          </label>
          <span
            className={cn(
              "text-[11px] tabular-nums",
              !captionOk || !hashtagsOk || !mentionsOk ? "text-red-600 dark:text-red-400" : "text-muted/90"
            )}
            aria-live="polite"
          >
            {caption.length}/{POST_LIMITS.captionMaxChars} chars · {hashtagCount}/{POST_LIMITS.maxHashtagTokens} hashtags ·{" "}
            {mentionCount}/{POST_LIMITS.maxMentionUsernames} @mentions
          </span>
        </div>
        <Textarea
          id={`${formId}-caption`}
          name="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What’s happening in your city? Add hashtags in your caption, like #Atlanta #Food #Nightlife"
          rows={4}
          disabled={disabled}
          maxLength={POST_LIMITS.captionMaxChars}
          aria-describedby={`${formId}-caption-hint`}
        />
        <p id={`${formId}-caption-hint`} className="text-xs leading-relaxed text-muted">
          Same ballpark as Instagram: up to {POST_LIMITS.captionMaxChars} characters and {POST_LIMITS.maxHashtagTokens}{" "}
          hashtag tokens. Tag people with <span className="font-medium text-foreground">@username</span> (up to{" "}
          {POST_LIMITS.maxMentionUsernames} per post). Example: <span className="font-medium text-foreground">#Atlanta</span>,{" "}
          <span className="font-medium text-foreground">@alex</span>.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={mediaFieldId}>
            Photos or video
          </label>
          <span className="text-[11px] text-muted">
            Up to {POST_LIMITS.maxMediaItems} files · {formatBytes(POST_LIMITS.maxMediaBytesTotal)} total max
          </span>
        </div>

        <input
          ref={fileInputRef}
          id={mediaFieldId}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={onFileInputChange}
          disabled={disabled}
          aria-describedby={`${formId}-media-help`}
        />

        {files.length === 0 ? (
          <div
            className={cn(
              "flex min-h-[148px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-card/40 px-4 py-6 text-center",
              "transition-colors",
              !disabled && "hover:border-border hover:bg-card/60"
            )}
          >
            <div className="rounded-full bg-foreground/5 p-3 text-muted" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth="1.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 16v2a1 1 0 001 1h14a1 1 0 001-1v-2M4 16V8a1 1 0 011-1h3m0 0 1-1V5a1 1 0 00-1-1H8a1 1 0 00-1 1v2m0 0h8"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Add photos or a video</p>
              <p id={`${formId}-media-help`} className="text-xs text-muted">
                JPG, PNG, GIF, WebP, HEIC, MP4, MOV, and similar formats. Max {POST_LIMITS.maxMediaItems} files,{" "}
                {formatBytes(POST_LIMITS.maxMediaBytesTotal)} total.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                "min-h-12 w-full max-w-xs rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold shadow-sm transition-colors",
                "hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              aria-controls={mediaFieldId}
            >
              Choose from library
            </button>
          </div>
        ) : (
          <>
            <p id={`${formId}-media-help`} className="text-xs text-muted">
              <span className="font-medium text-foreground">{files.length}</span> file{files.length === 1 ? "" : "s"} selected
              {" · "}
              <span className="font-medium text-foreground">{formatBytes(totalSize)}</span> total
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || files.length >= POST_LIMITS.maxMediaItems}
                className={cn(
                  "min-h-12 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors",
                  "hover:bg-foreground/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                aria-controls={mediaFieldId}
              >
                Add more files
              </button>
            </div>

            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Selected media previews">
              {files.map((file, index) => {
                const url = objectUrls[index];
                const showImageThumb = isImagePreview(file);
                return (
                  <li
                    key={`${index}-${file.lastModified}-${file.name}-${file.size}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted/20"
                  >
                    {showImageThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local blob previews only
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full flex-col justify-between gap-1 p-2 text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className="rounded-md bg-foreground/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
                            Video
                          </span>
                          <span className="truncate text-[9px] font-medium uppercase text-accent">{videoTypeLabel(file)}</span>
                        </div>
                        <p className="line-clamp-2 min-h-0 break-all text-[10px] font-medium leading-tight text-foreground">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-muted">{formatBytes(file.size)}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAt(index)}
                      disabled={disabled}
                      className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-sm font-bold text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {errorText && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {errorText}
        </p>
      )}

      <div className="space-y-3">
        <Button type="submit" className="w-full min-h-12" disabled={disabled || !canSubmit}>
          {phase === "uploading" ? "Uploading…" : phase === "finalizing" ? "Publishing…" : "Publish post"}
        </Button>
      </div>

      {busy && (
        <div
          id={`${formId}-publishing-status`}
          className="absolute inset-0 z-50 flex cursor-wait flex-col items-center justify-center gap-3 rounded-2xl bg-background/80 px-6 text-center backdrop-blur-sm"
          role="status"
          aria-live="assertive"
        >
          <span
            className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent"
            aria-hidden
          />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {phase === "uploading" ? "Uploading media…" : "Saving your post…"}
            </p>
            <p className="text-xs text-muted">
              {phase === "uploading"
                ? "Sending files directly to storage."
                : "Creating your post — almost done."}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
