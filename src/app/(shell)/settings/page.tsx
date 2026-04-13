import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/actions/auth";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-6 safe-pt">
      <header className="mb-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Settings</p>
        <h1 className="font-display text-3xl font-semibold">Control center</h1>
        <p className="text-sm text-muted">Account security lives in Supabase Auth — we keep UI lean.</p>
      </header>

      <section className="space-y-4 rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Appearance</p>
            <p className="text-xs text-muted">Dark mode respects system defaults.</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-6 space-y-3 rounded-3xl border border-border bg-card p-5 text-sm">
        <Link href="/me" className="flex min-h-11 items-center justify-between font-semibold">
          Your profile <span className="text-muted">→</span>
        </Link>
        <Link href="/search" className="flex min-h-11 items-center justify-between font-semibold">
          Search <span className="text-muted">→</span>
        </Link>
        {profile?.role === "admin" && (
          <Link href="/admin" className="flex min-h-11 items-center justify-between font-semibold text-accent">
            Admin console <span className="text-muted">→</span>
          </Link>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 text-xs leading-relaxed text-muted">
        <p>
          Creator and business upgrades stay lightweight for now: flip <code>account_type</code> in the
          database when you&apos;re ready — the profile surfaces badges automatically.
        </p>
      </section>

      <form action={signOut} className="mt-8">
        <Button type="submit" variant="outline" className="w-full">
          Log out
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted">@{profile?.username}</p>
    </div>
  );
}
