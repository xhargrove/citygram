"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, type OnboardingState } from "@/actions/onboarding";
import { createClient } from "@/lib/supabase/client";
import type { CityRow, InterestRow, NeighborhoodRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const interestKeys = [
  "music",
  "food",
  "nightlife",
  "fashion",
  "business",
  "sports",
  "art",
  "tech",
] as const;

type Props = {
  cities: CityRow[];
  interests: InterestRow[];
};

export function OnboardingForm({ cities, interests }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(completeOnboarding, {} as OnboardingState);
  const [cityId, setCityId] = useState(cities[0]?.id ?? "");
  const [hoods, setHoods] = useState<NeighborhoodRow[]>([]);

  useEffect(() => {
    if (state?.ok) {
      router.replace("/feed");
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    if (!cityId) return;
    const supabase = createClient();
    void supabase
      .from("neighborhoods")
      .select("*")
      .eq("city_id", cityId)
      .order("name")
      .then(({ data }) => setHoods((data as NeighborhoodRow[]) ?? []));
  }, [cityId]);

  const interestByKey = new Map(interests.map((i) => [i.key, i]));

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-8 px-6 py-10 safe-pt safe-pb">
      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Onboarding</p>
        <h1 className="font-display text-3xl font-semibold">Anchor yourself</h1>
        <p className="text-sm text-muted">
          Pick where you belong — your feed and your posts live here. Other metros are for looking around in Passport,
          not a second home feed.
        </p>
      </header>

      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">First name</label>
        <Input name="first_name" placeholder="Alex" required autoComplete="given-name" maxLength={60} />
      </section>

      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">Last name</label>
        <Input name="last_name" placeholder="Rivera" required autoComplete="family-name" maxLength={60} />
      </section>

      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">Site name</label>
        <Input
          name="display_name"
          placeholder="How you appear on Citygram"
          required
          maxLength={80}
          autoComplete="nickname"
        />
        <p className="text-xs text-muted">
          Your public name on posts and your profile. Your @handle is set from your first and last name above.
        </p>
      </section>

      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">Home city</label>
        <select
          name="home_city_id"
          required
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground"
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.region ?? c.country}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Neighborhood (optional)
        </label>
        <select
          name="neighborhood_id"
          className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground"
          defaultValue=""
        >
          <option value="">Choose a pocket of the city</option>
          {hoods.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Interests</p>
        <div className="grid grid-cols-2 gap-3">
          {interestKeys.map((key) => {
            const row = interestByKey.get(key);
            if (!row) return null;
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-sm"
              >
                <input type="checkbox" name="interests" value={key} className="h-4 w-4 accent-accent" />
                {row.label}
              </label>
            );
          })}
        </div>
      </section>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Enter my city"}
      </Button>
    </form>
  );
}
