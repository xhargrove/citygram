"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicEnv } from "@/lib/env";

type State = "idle" | "loading" | "sent" | "error";

export default function ForgotPasswordPage() {
  const env = getPublicEnv();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!env.supabaseConfigured) {
      setError("Supabase is not configured.");
      setState("error");
      return;
    }

    setState("loading");

    try {
      const supabase = createClient();
      const appUrl = env.appUrl.replace(/\/$/, "");
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?next=/settings`,
      });

      if (resetErr) {
        setError(resetErr.message);
        setState("error");
        return;
      }

      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between border-b border-border/50 px-5 safe-pt">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
            CG
          </span>
          <span className="text-sm font-semibold tracking-tight">CITYGRAM</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          Back to sign in
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 safe-pb">
        <div className="w-full max-w-sm">
          {state === "sent" ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7 text-foreground"
                  aria-hidden
                >
                  <path
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="mb-2 text-2xl font-bold tracking-tight">Check your email</h1>
              <p className="mb-6 text-sm text-muted">
                We sent a reset link to{" "}
                <span className="font-medium text-foreground">{email}</span>. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
                <p className="mt-1 text-sm text-muted">
                  Enter your email and we&apos;ll send a reset link
                </p>
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

                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="mt-1 h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {state === "loading" ? "Sending…" : "Send reset link"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-muted">
                Remembered it?{" "}
                <Link
                  href="/login"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
