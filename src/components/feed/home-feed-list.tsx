"use client";

import { useCallback, useEffect, useState } from "react";
import { loadMoreHomeFeedPosts } from "@/actions/feed";
import { CITY_FEED_PAGE_SIZE } from "@/lib/data/posts";
import type { PostWithAuthor } from "@/types/database";
import { cn } from "@/lib/utils";
import { PostCard, type FeedMediaAspect } from "./post-card";

const FEED_ASPECT_STORAGE_KEY = "citygram-feed-media-aspect";

const ASPECT_OPTIONS: { value: FeedMediaAspect; label: string; hint: string }[] = [
  { value: "square", label: "1:1", hint: "Square" },
  { value: "portrait", label: "4:5", hint: "Portrait" },
  { value: "wide", label: "16:9", hint: "Wide" },
];

type Props = {
  initialPosts: PostWithAuthor[];
};

function readStoredAspect(): FeedMediaAspect | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FEED_ASPECT_STORAGE_KEY);
    if (raw === "square" || raw === "portrait" || raw === "wide") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function HomeFeedList({ initialPosts }: Props) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialPosts.length < CITY_FEED_PAGE_SIZE);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [mediaAspect, setMediaAspect] = useState<FeedMediaAspect>("square");

  useEffect(() => {
    const stored = readStoredAspect();
    if (stored) setMediaAspect(stored);
  }, []);

  function selectAspect(next: FeedMediaAspect) {
    setMediaAspect(next);
    try {
      localStorage.setItem(FEED_ASPECT_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const loadMore = useCallback(async () => {
    setLoadMoreError(null);
    setLoading(true);
    try {
      const { posts: next, done: noMore } = await loadMoreHomeFeedPosts(posts.length);
      setPosts((prev) => [...prev, ...next]);
      setDone(noMore);
    } catch {
      setLoadMoreError("Couldn’t load more posts. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [posts.length]);

  return (
    <>
      <div className="border-b border-border/50 bg-gradient-to-r from-accent/8 via-background/95 to-accent/5 px-4 py-3 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
            <span
              className="inline-block h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_var(--city-glow)]"
              aria-hidden
            />
            Media crop
          </span>
          <div className="flex gap-1 rounded-full border border-border/50 bg-card/60 p-0.5 shadow-sm" role="group" aria-label="Feed photo shape">
            {ASPECT_OPTIONS.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectAspect(value)}
                title={hint}
                aria-pressed={mediaAspect === value}
                aria-label={`${hint} (${label})`}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-xs font-semibold transition-all",
                  mediaAspect === value
                    ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
                    : "text-muted hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        {posts.map((p, i) => (
          <PostCard key={p.id} post={p} priorityImage={i === 0} mediaAspect={mediaAspect} />
        ))}
      </div>

      {!done && (
        <div className="flex flex-col items-center gap-3 px-4 py-8">
          {loadMoreError && (
            <p
              className="max-w-md rounded-xl border border-red-500/35 bg-red-500/[0.07] px-4 py-3 text-center text-sm text-red-700 dark:text-red-300"
              role="alert"
            >
              {loadMoreError}
            </p>
          )}
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="relative overflow-hidden rounded-full border border-border/60 bg-card/80 px-8 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-accent/30 hover:shadow-city disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <span className="animate-pulse">Loading…</span> : loadMoreError ? "Try again" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
