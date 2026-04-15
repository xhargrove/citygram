import type { CityPulseStats } from "@/lib/data/feed-activity";

type Props = {
  cityName: string;
  stats: CityPulseStats;
};

export function CityPulseCard({ cityName, stats }: Props) {
  const { postsTodayUtc, distinctPostersTodayUtc, neighborhoodsActiveTodayUtc } = stats;

  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-card/90 to-card/60 px-4 py-4 shadow-sm dark:from-card/40 dark:to-card/25">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">City pulse</p>
      <h2 className="mt-1 font-display text-lg font-semibold text-foreground">{cityName} pulse</h2>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-background/60 px-2 py-2 dark:bg-background/20">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">Posts today</dt>
          <dd className="text-lg font-bold tabular-nums text-foreground">{postsTodayUtc}</dd>
        </div>
        <div className="rounded-xl bg-background/60 px-2 py-2 dark:bg-background/20">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">Active voices</dt>
          <dd className="text-lg font-bold tabular-nums text-foreground">{distinctPostersTodayUtc}</dd>
        </div>
        <div className="rounded-xl bg-background/60 px-2 py-2 dark:bg-background/20">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">Neighborhoods</dt>
          <dd className="text-lg font-bold tabular-nums text-foreground">
            {neighborhoodsActiveTodayUtc > 0 ? neighborhoodsActiveTodayUtc : "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[10px] text-muted">Today = UTC calendar day · {cityName} only</p>
    </div>
  );
}
