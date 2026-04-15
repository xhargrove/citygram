import Link from "next/link";
import type { ElsewhereCity } from "@/lib/data/feed-activity";

type Props = {
  cities: ElsewhereCity[];
};

export function ElsewhereOnCitygram({ cities }: Props) {
  if (cities.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-muted/10 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Beyond your city</p>
      <h3 className="mt-0.5 font-display text-base font-semibold text-foreground">Elsewhere on CITYGRAM</h3>
      <p className="mt-1 text-xs text-muted">
        People are posting in these cities — last 24 hours, public preview only. Your home feed stays in your city.
      </p>
      <ul className="mt-3 space-y-2">
        {cities.map((c) => (
          <li key={c.cityId}>
            <Link
              href={`/passport/${c.slug}`}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm transition hover:bg-foreground/5"
            >
              <span className="font-medium text-foreground">{c.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {c.postsLast24h} {c.postsLast24h === 1 ? "post" : "posts"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/explore" className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">
        Explore cities →
      </Link>
    </div>
  );
}
