"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPublicEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const env = getPublicEnv();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
    try {
      const supabase = createClient();
      const appUrl = env.appUrl.replace(/\/$/, "");
      const { error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback?next=/onboarding`,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      });
      if (signErr) {
        setError(signErr.message);
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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12 safe-pt safe-pb">
      <div className="mb-10 text-center">
        <p className="font-display text-3xl font-semibold">Join CITYGRAM</p>
        <p className="mt-2 text-sm text-muted">Your block. Your borough. Your feed.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Display name
          </label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
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
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Password
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
