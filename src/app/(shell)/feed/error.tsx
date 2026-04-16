"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function FeedError({ error, reset }: Props) {
  useEffect(() => {
    // Helps match production "digest" errors to Vercel / server logs.
    console.error("[Citygram feed error]", error?.message, error?.digest ?? "");
  }, [error]);
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-14">
      <div className="rounded-2xl border border-border/60 bg-card/60 px-5 py-8 text-center shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted">Feed unavailable</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-foreground">Couldn&apos;t load your city feed</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Something went wrong while loading posts. This isn&apos;t the same as an empty feed.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground"
          >
            Try again
          </button>
          <Link
            href="/explore"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground"
          >
            Explore cities
          </Link>
        </div>
      </div>
    </div>
  );
}
