"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, type CreatePostState } from "@/actions/post";
import { createClient } from "@/lib/supabase/client";
import type { CityRow, NeighborhoodRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = {
  cities: CityRow[];
  defaultCityId: string;
  defaultNeighborhoodId: string | null;
};

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const ACCEPT = "image/*,video/*";

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

export function CreatePostForm({ cities, defaultCityId, defaultNeighborhoodId }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPost, {} as CreatePostState);
  const [cityId, setCityId] = useState(defaultCityId);
  const [hoods, setHoods] = useState<NeighborhoodRow[]>([]);
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
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
    if (state?.ok && state.postId) {
      router.replace(`/post/${state.postId}`);
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("neighborhoods")
      .select("*")
      .eq("city_id", cityId)
      .order("name")
      .then(({ data }) => setHoods((data as NeighborhoodRow[]) ?? []));
  }, [cityId]);

  const totalSize = totalBytes(files);
  const canSubmit =
    files.length > 0 &&
    files.length <= MAX_FILES &&
    totalSize <= MAX_TOTAL_BYTES &&
    files.every(isAllowedFile);

  function tryAddFiles(incoming: File[]) {
    setClientError(null);
    if (incoming.length === 0) return;
    const allowedIncoming = incoming.filter(isAllowedFile);
    if (allowedIncoming.length < incoming.length) {
      setClientError("Only image and video files are supported.");
    }
    if (allowedIncoming.length === 0) return;
    const merged = [...files, ...allowedIncoming];
    if (merged.length > MAX_FILES) {
      setClientError(`You can add up to ${MAX_FILES} files.`);
      return;
    }
    const t = totalBytes(merged);
    if (t > MAX_TOTAL_BYTES) {
      setClientError(
        `Total size must be ${formatBytes(MAX_TOTAL_BYTES)} or less (this would be ${formatBytes(t)}).`
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    if (files.length === 0) {
      setClientError("Add at least one photo or video.");
      return;
    }
    if (files.length > MAX_FILES) {
      setClientError(`You can add up to ${MAX_FILES} files.`);
      return;
    }
    if (!files.every(isAllowedFile)) {
      setClientError("Only image and video files are supported.");
      return;
    }
    const t = totalBytes(files);
    if (t > MAX_TOTAL_BYTES) {
      setClientError(`Total size must be ${formatBytes(MAX_TOTAL_BYTES)} or less.`);
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.delete("media");
    for (const f of files) {
      fd.append("media", f);
    }
    formAction(fd);
  }

  const errorText = clientError ?? state?.error;
  const disabled = pending;

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto max-w-lg space-y-6 px-4 py-6 safe-pt safe-pb"
      aria-busy={pending}
      aria-describedby={pending ? `${formId}-publishing-status` : undefined}
      noValidate
    >
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Create</p>
        <h1 className="font-display text-2xl font-semibold">Share a moment</h1>
        <p className="text-sm text-muted">
          Media uploads to Supabase Storage. City defaults to your home city — change it if you&apos;re
          posting while traveling.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`${formId}-city`}>
          City
        </label>
        <select
          id={`${formId}-city`}
          name="city_id"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-sm"
          required
          disabled={disabled}
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`${formId}-hood`}>
          Neighborhood (optional)
        </label>
        <select
          id={`${formId}-hood`}
          name="neighborhood_id"
          defaultValue={defaultNeighborhoodId ?? ""}
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
        <div className="flex items-end justify-between gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={`${formId}-caption`}>
            Caption
          </label>
          <span className="text-[11px] tabular-nums text-muted/90" aria-live="polite">
            {caption.length}
            <span className="text-muted/70"> chars</span>
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
          aria-describedby={`${formId}-caption-hint`}
        />
        <p id={`${formId}-caption-hint`} className="text-xs leading-relaxed text-muted">
          Hashtags are detected from your caption — for example <span className="font-medium text-foreground">#Atlanta</span>,{" "}
          <span className="font-medium text-foreground">#Food</span>, <span className="font-medium text-foreground">#Nightlife</span>.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted" htmlFor={mediaFieldId}>
            Photos or video
          </label>
          <span className="text-[11px] text-muted">
            Up to {MAX_FILES} files · {formatBytes(MAX_TOTAL_BYTES)} total max
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
                JPG, PNG, GIF, WebP, HEIC, MP4, MOV, and similar formats. Max {MAX_FILES} files,{" "}
                {formatBytes(MAX_TOTAL_BYTES)} total.
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
                disabled={disabled || files.length >= MAX_FILES}
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
          {pending ? "Working…" : "Publish post"}
        </Button>
      </div>

      {pending && (
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
            <p className="text-sm font-semibold text-foreground">Uploading media & publishing…</p>
            <p className="text-xs text-muted">Keep this screen open — this won&apos;t take long.</p>
          </div>
        </div>
      )}
    </form>
  );
}
