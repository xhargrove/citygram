"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { clearProfileAvatar, updateProfileAvatar } from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Props = {
  userId: string;
  hasAvatar: boolean;
  /** compact = horizontal chip row for profile header */
  compact?: boolean;
};

function safeImageExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (/^[a-z0-9]{1,5}$/i.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export function ProfileAvatarUpload({ userId, hasAvatar, compact }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingClear, startClear] = useTransition();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be 5MB or smaller.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const ext = safeImageExt(file);
      const path = `${userId}/avatar/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("post-media").upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (upErr) throw new Error(upErr.message);

      const res = await updateProfileAvatar(path);
      if (res.error) throw new Error(res.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function onClear() {
    setError(null);
    startClear(async () => {
      const res = await clearProfileAvatar();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  const disabled = loading || pendingClear;

  const controls = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={onFile}
        aria-hidden
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={compact ? "shrink-0" : "w-full"}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? "Uploading…" : "Change photo"}
      </Button>
      {hasAvatar && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={compact ? "shrink-0 text-muted" : "w-full text-muted"}
          disabled={disabled}
          onClick={onClear}
        >
          {pendingClear ? "Removing…" : "Remove photo"}
        </Button>
      )}
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {controls}
        {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[140px] flex-col gap-2">
      {controls}
      {error && <p className="text-center text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
