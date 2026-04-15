import Link from "next/link";

type Props = {
  cityName: string;
  postsTodayUtc: number;
  distinctPostersTodayUtc: number;
};

/**
 * Lightweight awareness strip: real UTC-day counts for the viewer’s home city.
 */
export function FeedActivityStrip({ cityName, postsTodayUtc, distinctPostersTodayUtc }: Props) {
  if (postsTodayUtc === 0 && distinctPostersTodayUtc === 0) {
    return (
      <div className="mx-4 mt-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-[13px] leading-snug text-muted">
        <p>
          <span className="font-medium text-foreground">{cityName}</span> is quiet so far today — your post could be the
          one people see first.
        </p>
        <p className="mt-2 text-[12px] leading-snug">
          Others are posting on CITYGRAM in other cities. Open{" "}
          <Link href="/explore" className="font-semibold text-accent underline-offset-2 hover:underline">
            Explore
          </Link>{" "}
          to see fresh public posts — your home feed below stays {cityName}-only.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-[13px] leading-snug text-foreground">
      <p className="font-medium text-foreground">Neighbors posted in {cityName} today</p>
      <p className="mt-1">
        <span className="font-semibold text-foreground">{postsTodayUtc}</span>{" "}
        {postsTodayUtc === 1 ? "post" : "posts"}
        {distinctPostersTodayUtc > 0 ? (
          <>
            {" "}
            · from{" "}
            <span className="font-semibold">{distinctPostersTodayUtc}</span>{" "}
            {distinctPostersTodayUtc === 1 ? "person" : "people"}
          </>
        ) : null}
      </p>
      <p className="mt-1 text-[11px] text-muted">Today = UTC · your home city only — these are real people, not a global “For you” feed.</p>
    </div>
  );
}
