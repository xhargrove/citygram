"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CitygramLogo } from "@/components/brand/citygram-logo";
import { getPublicEnv } from "@/lib/env";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextAfterLogin = searchParams.get("next");

  const env = getPublicEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginHref =
    nextAfterLogin && nextAfterLogin !== "/feed"
      ? `/login?next=${encodeURIComponent(nextAfterLogin)}`
      : "/login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!env.supabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const appUrl = env.appUrl.replace(/\/$/, "");

      const { data: signUpData, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
          data: {
            display_name: email.split("@")[0],
          },
        },
      });

      if (signErr) {
        setError(signErr.message);
        return;
      }

      // Email confirmation enabled → no session until user clicks link; don't send to onboarding logged-out.
      if (signUpData.user && !signUpData.session) {
        router.replace(`/login?notice=${encodeURIComponent("confirm-email")}`);
        router.refresh();
        return;
      }

      router.replace("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border/50 px-5 safe-pt">
        <Link href="/" className="flex items-center gap-2" aria-label="CITYGRAM home">
          <CitygramLogo size={28} priority />
          <span className="text-sm font-semibold tracking-tight">CITYGRAM</span>
        </Link>
        <Link
          href={loginHref}
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 safe-pb">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Join CITYGRAM</h1>
            <p className="mt-1 text-sm text-muted">Your city is waiting</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {error && (
              <div
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-4 px-4 text-center text-xs text-muted">
            By joining, you agree that this is a city-first space — be real, be local.
          </p>

          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
