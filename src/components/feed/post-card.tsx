"use client";

import Link from "next/link";
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { recordShare, toggleLike, toggleSave } from "@/actions/social";
import { reportPost } from "@/actions/report";
import { Avatar } from "@/components/media/avatar";
import { SupabaseFillImage } from "@/components/media/supabase-fill-image";
import { storagePublicUrl } from "@/lib/media";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { PostMediaRow, PostWithAuthor } from "@/types/database";

/** When set (e.g. home feed), locks the media frame to one aspect for all breakpoints. */
export type FeedMediaAspect = "square" | "portrait" | "wide";

type Props = {
  post: PostWithAuthor;
  /** First card in a list: prioritize LCP image fetch. */
  priorityImage?: boolean;
  /** Omit to keep the default responsive crop (4:5 mobile, 16:9 on sm+). */
  mediaAspect?: FeedMediaAspect;
};

type OptimisticPost = {
  likes: number;
  liked: boolean;
  saved: boolean;
};

const FEED_ASPECT_CLASS: Record<FeedMediaAspect, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  wide: "aspect-video",
};

const SWIPE_PX = 48;

function PostMediaCarousel({
  media,
  aspectClassName,
  priorityImage,
  blockLinkRef,
}: {
  media: PostMediaRow[];
  aspectClassName: string;
  priorityImage: boolean;
  blockLinkRef: MutableRefObject<boolean>;
}) {
  const count = media.length;
  const [index, setIndex] = useState(0);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (v && i !== index) v.pause();
    });
  }, [index]);

  function go(delta: number) {
    if (count < 2) return;
    blockLinkRef.current = true;
    setIndex((i) => (i + delta + count) % count);
    window.setTimeout(() => {
      blockLinkRef.current = false;
    }, 150);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (count < 2 || !pointerStart.current) {
      pointerStart.current = null;
      return;
    }
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? 1 : -1);
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Post media"
      className={cn("relative w-full overflow-hidden", aspectClassName)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: `${count * 100}%`,
          transform: `translateX(-${(index * 100) / count}%)`,
        }}
      >
        {media.map((item, i) => (
          <div
            key={item.id}
            className="relative h-full shrink-0 overflow-hidden"
            style={{ width: `${100 / count}%` }}
          >
            {item.media_type === "image" ? (
              <div className="absolute inset-0">
                <SupabaseFillImage
                  src={storagePublicUrl(item.storage_path)}
                  alt=""
                  sizes="(max-width: 512px) 100vw, 512px"
                  priority={priorityImage && i === 0}
                />
              </div>
            ) : (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={storagePublicUrl(item.storage_path)}
                className="h-full w-full object-cover"
                controls={i === index}
                playsInline
                preload="metadata"
              />
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <div
            className="absolute bottom-3 left-0 right-0 z-10 flex justify-center gap-1.5 px-8"
            role="tablist"
            aria-label="Slides"
          >
            {media.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1} of ${count}`}
                className={cn(
                  "h-1.5 min-h-[6px] rounded-full transition-[width,background-color] duration-200",
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  blockLinkRef.current = true;
                  setIndex(i);
                  window.setTimeout(() => {
                    blockLinkRef.current = false;
                  }, 150);
                }}
              />
            ))}
          </div>
          <button
            type="button"
            className="absolute left-1 top-1/2 z-10 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white hover:bg-black/55 sm:flex"
            aria-label="Previous slide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-1 top-1/2 z-10 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-2xl text-white hover:bg-black/55 sm:flex"
            aria-label="Next slide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(1);
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}

export function PostCard({ post, priorityImage = false, mediaAspect }: Props) {
  const carouselBlockLinkRef = useRef(false);
  const [pending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic<OptimisticPost, Partial<OptimisticPost>>(
    { likes: post.like_count, liked: !!post.liked_by_me, saved: !!post.saved_by_me },
    (state, next) => ({ ...state, ...next })
  );

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
              <span className="text-muted/80"> · {formatRelativeTime(post.created_at)}</span>
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

      <Link
        href={href}
        className="block bg-black/5 dark:bg-black/40"
        onClick={(e) => {
          if (carouselBlockLinkRef.current) {
            e.preventDefault();
          }
        }}
      >
        {post.media.length > 0 && (
          <PostMediaCarousel
            media={post.media}
            aspectClassName={
              mediaAspect ? FEED_ASPECT_CLASS[mediaAspect] : "aspect-[4/5] sm:aspect-video"
            }
            priorityImage={priorityImage}
            blockLinkRef={carouselBlockLinkRef}
          />
        )}
      </Link>

      <div className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition",
              optimistic.liked ? "text-accent" : "text-foreground"
            )}
            onClick={onLike}
            disabled={pending}
            aria-pressed={optimistic.liked}
            aria-label={optimistic.liked ? "Unlike" : "Like"}
          >
            <HeartIcon filled={optimistic.liked} />
          </button>
          <Link
            href={`${href}#comments`}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground"
            aria-label="Comments"
          >
            <CommentIcon />
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-foreground"
            onClick={onShare}
            aria-label="Share"
          >
            <ShareIcon />
          </button>
          <button
            type="button"
            className={cn(
              "ml-auto inline-flex min-h-11 min-w-11 items-center justify-center rounded-full transition",
              optimistic.saved ? "text-accent" : "text-foreground"
            )}
            onClick={onSave}
            disabled={pending}
            aria-pressed={optimistic.saved}
            aria-label={optimistic.saved ? "Remove from saved" : "Save"}
          >
            <BookmarkIcon filled={optimistic.saved} />
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
        {post.tagged_profiles && post.tagged_profiles.length > 0 && (
          <p className="text-xs text-muted">
            With{" "}
            {post.tagged_profiles.map((t, i) => (
              <span key={t.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/u/${t.username}`} className="font-medium text-foreground hover:underline">
                  @{t.username}
                </Link>
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className="h-6 w-6" aria-hidden>
      <path
        d="M12 21s-6.2-4.35-8.4-8.15A5.7 5.7 0 0 1 12 5.25a5.7 5.7 0 0 1 8.4 7.6C18.2 16.65 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M21 12a8 8 0 0 1-8 8H8l-5 3v-3a8 8 0 1 1 18-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
      <path
        d="M7 17 17 7M7 7h6v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} className="h-6 w-6" aria-hidden>
      <path
        d="M6 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
