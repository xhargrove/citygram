"use client";

import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PostError({ reset }: Props) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-14">
      <div className="rounded-2xl border border-border/60 bg-card/60 px-5 py-8 text-center shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted">Post unavailable</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-foreground">Couldn&apos;t load this post</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We hit a problem loading this thread. If the post was removed, you&apos;ll see a not-found page instead.
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
            href="/feed"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-background px-5 text-sm font-semibold text-foreground"
          >
            Back to feed
          </Link>
        </div>
      </div>
    </div>
  );
}
