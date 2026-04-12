"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const env = getPublicEnv();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!env.supabaseConfigured) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const appUrl = env.appUrl.replace(/\/$/, "");
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/callback?next=/settings`,
      });
      if (resetErr) {
        setError(resetErr.message);
        return;
      }
      setMessage("Check your inbox for a reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12 safe-pt safe-pb">
      <div className="mb-8 text-center">
        <p className="font-display text-2xl font-semibold">Reset access</p>
        <p className="mt-2 text-sm text-muted">We&apos;ll email you a secure link.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
          </label>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {message && <p className="text-sm text-accent">{message}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <Link href="/login" className="mt-8 block text-center text-sm text-accent">
        Back to log in
      </Link>
    </div>
  );
}
