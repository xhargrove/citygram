import Link from "next/link";
import { notFound } from "next/navigation";
import { moderateRemovePostAction } from "@/actions/report";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["moderator", "admin"].includes(profile.role)) {
    notFound();
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, status, post_id, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(40);

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-24 pt-6 safe-pt">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Admin</p>
          <h1 className="font-display text-3xl font-semibold">Moderation desk</h1>
        </div>
        <Link href="/feed" className="text-sm font-semibold text-accent">
          Exit
        </Link>
      </header>

      <p className="mb-6 rounded-2xl border border-dashed border-border bg-card px-4 py-3 text-sm text-muted">
        Placeholder console — wire deeper analytics and queue assignments in V2. Today you can review
        open reports and remove posts that violate local guidelines.
      </p>

      <ul className="space-y-4">
        {(reports ?? []).length === 0 && (
          <li className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted">
            No open reports. Community looks calm.
          </li>
        )}
        {(reports ?? []).map((report) => (
          <li key={report.id} className="rounded-2xl border border-border bg-card px-4 py-4 text-sm">
            <p className="font-semibold">{report.reason}</p>
            <p className="text-xs text-muted">{new Date(report.created_at).toLocaleString()}</p>
            {report.post_id && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/post/${report.post_id}`} className="text-xs font-semibold text-accent">
                  Inspect post
                </Link>
                <form action={moderateRemovePostAction.bind(null, report.post_id!)}>
                  <Button type="submit" size="sm" variant="outline">
                    Remove post
                  </Button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
