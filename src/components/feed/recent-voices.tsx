import Link from "next/link";
import { Avatar } from "@/components/media/avatar";
import type { RecentVoice } from "@/lib/data/feed-activity";
import { formatRelativeTime } from "@/lib/utils";

type Props = {
  cityName: string;
  voices: RecentVoice[];
};

export function RecentVoices({ cityName, voices }: Props) {
  if (voices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 px-4 py-5 text-center">
        <p className="text-sm font-semibold text-foreground">New in {cityName}</p>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          When other people post in {cityName}, their profiles show up here so you can see who&apos;s active — be among
          the first by sharing a moment from your block.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Recent voices</p>
      <h3 className="mt-0.5 font-display text-base font-semibold text-foreground">Active in {cityName}</h3>
      <ul className="mt-3 space-y-3" aria-label={`Recent posters in ${cityName}`}>
        {voices.map(({ profile, lastPostAt, postsThisWeekUtc }) => (
          <li key={profile.id}>
            <Link
              href={`/u/${profile.username}`}
              className="flex items-center gap-3 rounded-xl py-1 transition hover:bg-foreground/5"
            >
              <Avatar src={profile.avatar_url} alt={profile.display_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{profile.display_name}</p>
                <p className="truncate text-xs text-muted">
                  @{profile.username} · Last post {formatRelativeTime(lastPostAt)}
                  {postsThisWeekUtc > 1 ? ` · ${postsThisWeekUtc} this week` : null}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
