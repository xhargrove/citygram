import Link from "next/link";
import { markNotificationsRead } from "@/actions/notifications";
import { Avatar } from "@/components/media/avatar";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(80);

  const notifications = rows ?? [];
  const actorIds = [
    ...new Set(notifications.map((n) => n.actor_id).filter(Boolean) as string[]),
  ];

  const { data: actors } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", actorIds);

  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6 safe-pt">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Alerts</p>
          <h1 className="font-display text-3xl font-semibold">Notifications</h1>
        </div>
        <form action={markNotificationsRead}>
          <Button type="submit" variant="outline" size="sm">
            Mark read
          </Button>
        </form>
      </header>

      <ul className="space-y-3">
        {notifications.length === 0 && (
          <li className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted">
            Quiet for now — follows, likes, and comments surface here in real time.
          </li>
        )}
        {notifications.map((n) => {
          const actor = n.actor_id ? actorMap.get(n.actor_id) : null;
          const label =
            n.type === "follow"
              ? "started following you"
              : n.type === "like"
                ? "liked your post"
                : n.type === "comment"
                  ? "commented on your post"
                  : "mentioned you";

          return (
            <li
              key={n.id}
              className={`flex gap-3 rounded-2xl border border-border bg-card px-3 py-3 ${
                n.read ? "opacity-60" : ""
              }`}
            >
              {actor && <Avatar src={actor.avatar_url} alt={actor.display_name} size="sm" />}
              <div className="min-w-0 flex-1 text-sm">
                <p>
                  {actor ? (
                    <>
                      <Link href={`/u/${actor.username}`} className="font-semibold">
                        @{actor.username}
                      </Link>{" "}
                      {label}
                    </>
                  ) : (
                    <span className="text-muted">System update</span>
                  )}
                </p>
                {n.post_id && (
                  <Link href={`/post/${n.post_id}`} className="text-xs text-accent">
                    View thread
                  </Link>
                )}
                <p className="text-xs text-muted">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
