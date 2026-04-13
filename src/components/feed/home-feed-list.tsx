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
    setLoading(true);
    try {
      const { posts: next, done: noMore } = await loadMoreHomeFeedPosts(posts.length);
      setPosts((prev) => [...prev, ...next]);
      setDone(noMore);
    } finally {
      setLoading(false);
    }
  }, [posts.length]);

  return (
    <>
      <div className="border-b border-border/70 bg-background/95 px-4 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Media crop</span>
          <div className="flex gap-1" role="group" aria-label="Feed photo shape">
            {ASPECT_OPTIONS.map(({ value, label, hint }) => (
              <button
                key={value}
                type="button"
                onClick={() => selectAspect(value)}
                title={hint}
                aria-pressed={mediaAspect === value}
                aria-label={`${hint} (${label})`}
                className={cn(
                  "min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors",
                  mediaAspect === value
                    ? "border-accent bg-accent/15 text-foreground"
                    : "border-border bg-card text-muted hover:border-border hover:text-foreground"
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
        <div className="flex justify-center px-4 py-8">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}
