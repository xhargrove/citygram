"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatSignInError, isEmailNotConfirmedError } from "@/lib/supabase/auth-errors";
import { CitygramLogo } from "@/components/brand/citygram-logo";
import { getPublicEnv } from "@/lib/env";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/feed";
  const notice = searchParams.get("notice");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const signupHref =
    next && next !== "/feed" ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });

      if (signErr) {
        setNeedsEmailConfirm(isEmailNotConfirmedError(signErr));
        setResendState("idle");
        setError(formatSignInError(signErr));
        return;
      }

      setNeedsEmailConfirm(false);
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email above, then tap resend.");
      return;
    }
    setResendState("sending");
    const env = getPublicEnv();
    const appUrl = env.appUrl.replace(/\/$/, "");
    try {
      const supabase = createClient();
      const { error: resendErr } = await supabase.auth.resend({
        type: "signup",
        email: trimmed,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
        },
      });
      if (resendErr) {
        setResendState("failed");
        setError(resendErr.message);
        return;
      }
      setResendState("sent");
      setError(null);
    } catch {
      setResendState("failed");
      setError("Could not resend email. Try again.");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border/50 px-5 safe-pt">
        <Link href="/" className="flex items-center" aria-label="CITYGRAM home">
          <CitygramLogo size={36} priority />
        </Link>
        <Link
          href={signupHref}
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Create account
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 safe-pb">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Sign in to your city</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {notice === "confirm-email" && (
              <div
                className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground"
                role="status"
              >
                Check your email for a confirmation link. After you confirm, sign in here with the same
                password you chose.
              </div>
            )}
            {error && (
              <div
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}
            {(needsEmailConfirm || notice === "confirm-email") && (
              <div className="space-y-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <p className="text-muted">
                  Still waiting on the email? We can send another confirmation link to{" "}
                  <span className="font-medium text-foreground">{email || "your address"}</span>
                  {email ? "" : " (fill in your email first)"}.
                </p>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={loading || resendState === "sending"}
                  className="text-sm font-semibold text-accent underline-offset-4 hover:underline disabled:opacity-50"
                >
                  {resendState === "sending" ? "Sending…" : "Resend confirmation email"}
                </button>
                {resendState === "sent" && (
                  <p className="text-xs text-muted" role="status">
                    Check your inbox (and Spam) for the new link.
                  </p>
                )}
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted transition-colors hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            New to CITYGRAM?{" "}
            <Link
              href={signupHref}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
