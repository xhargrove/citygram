"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { recordShare, toggleLike, toggleSave } from "@/actions/social";
import { reportPost } from "@/actions/report";
import { Avatar } from "@/components/media/avatar";
import { storagePublicUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { PostWithAuthor } from "@/types/database";
type Props = {
  post: PostWithAuthor;
};

type OptimisticPost = {
  likes: number;
  liked: boolean;
  saved: boolean;
};

export function PostCard({ post }: Props) {
  const [pending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic<OptimisticPost, Partial<OptimisticPost>>(
    { likes: post.like_count, liked: !!post.liked_by_me, saved: !!post.saved_by_me },
    (state, next) => ({ ...state, ...next })
  );

  const primary = post.media[0];
  const href = `/post/${post.id}`;

  async function onLike() {
    startTransition(async () => {
      addOptimistic({
        liked: !optimistic.liked,
        likes: optimistic.liked ? optimistic.likes - 1 : optimistic.likes + 1,
      });
      await toggleLike(post.id);
    });
  }

  async function onSave() {
    startTransition(async () => {
      addOptimistic({ saved: !optimistic.saved });
      await toggleSave(post.id);
    });
  }

  async function onShare() {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}${href}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "CITYGRAM", text: post.caption ?? "", url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
    await recordShare(post.id);
  }

  async function onReport() {
    const reason = window.prompt("What feels off about this post?");
    if (!reason) return;
    await reportPost(post.id, reason);
  }

  return (
    <article className="border-b border-border bg-card/40">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href={`/u/${post.author.username}`} className="flex min-h-[44px] flex-1 items-center gap-3">
          <Avatar src={post.author.avatar_url} alt={post.author.display_name} />
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold">{post.author.display_name}</p>
            <p className="truncate text-xs text-muted">
              @{post.author.username} · {post.city.name}
              {post.is_sponsored_placeholder && (
                <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  Local spotlight
                </span>
              )}
            </p>
          </div>
        </Link>
        <button
          type="button"
          className="min-h-10 min-w-10 rounded-full text-xs text-muted hover:text-foreground"
          onClick={onReport}
        >
          ···
        </button>
      </header>

      <Link href={href} className="block bg-black/5 dark:bg-black/40">
        {primary && (
          <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-video">
            {primary.media_type === "image" ? (
              <Image
                src={storagePublicUrl(primary.storage_path)}
                alt=""
                fill
                className="object-cover"
                sizes="100vw"
                priority={false}
              />
            ) : (
              <video
                src={storagePublicUrl(primary.storage_path)}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
              />
            )}
            {post.media.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                {post.media.length} slides
              </span>
            )}
          </div>
        )}
      </Link>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            className={cn(
              "min-h-11 min-w-11 rounded-full text-lg transition",
              optimistic.liked ? "text-accent" : "text-foreground"
            )}
            onClick={onLike}
            disabled={pending}
            aria-pressed={optimistic.liked}
          >
            ♥
          </button>
          <Link href={`${href}#comments`} className="min-h-11 min-w-11 rounded-full text-lg">
            💬
          </Link>
          <button type="button" className="min-h-11 min-w-11 rounded-full text-lg" onClick={onShare}>
            ↗
          </button>
          <button
            type="button"
            className={cn(
              "ml-auto min-h-11 min-w-11 rounded-full text-lg",
              optimistic.saved ? "text-accent" : "text-foreground"
            )}
            onClick={onSave}
            disabled={pending}
            aria-pressed={optimistic.saved}
          >
            ★
          </button>
        </div>
        <p className="text-sm font-semibold">{optimistic.likes} likes</p>
        {post.caption && (
          <p className="text-sm leading-relaxed text-foreground/90">
            <Link href={`/u/${post.author.username}`} className="mr-2 font-semibold">
              @{post.author.username}
            </Link>
            {post.caption}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {post.hashtags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent("#" + tag)}`}
              className="text-xs font-medium text-accent"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}
