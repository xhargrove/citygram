"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, type CreatePostState } from "@/actions/post";
import { createClient } from "@/lib/supabase/client";
import type { CityRow, NeighborhoodRow } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  cities: CityRow[];
  defaultCityId: string;
  defaultNeighborhoodId: string | null;
};

export function CreatePostForm({ cities, defaultCityId, defaultNeighborhoodId }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPost, {} as CreatePostState);
  const [cityId, setCityId] = useState(defaultCityId);
  const [hoods, setHoods] = useState<NeighborhoodRow[]>([]);

  useEffect(() => {
    if (state?.ok && state.postId) {
      router.replace(`/post/${state.postId}`);
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("neighborhoods")
      .select("*")
      .eq("city_id", cityId)
      .order("name")
      .then(({ data }) => setHoods((data as NeighborhoodRow[]) ?? []));
  }, [cityId]);

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-6 px-4 py-6 safe-pt safe-pb">
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Create</p>
        <h1 className="font-display text-2xl font-semibold">Share a moment</h1>
        <p className="text-sm text-muted">
          Media uploads to Supabase Storage. City defaults to your home city — change it if you&apos;re
          posting while traveling.
        </p>
      </header>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">City</label>
        <select
          name="city_id"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-sm"
          required
        >
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Neighborhood (optional)
        </label>
        <select
          name="neighborhood_id"
          defaultValue={defaultNeighborhoodId ?? ""}
          className="min-h-12 w-full rounded-xl border border-border bg-card px-4 text-sm"
        >
          <option value="">None</option>
          {hoods.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">Caption</label>
        <Textarea name="caption" placeholder="What’s alive in your city today?" rows={4} />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted">
          Photos or video
        </label>
        <input
          name="media"
          type="file"
          accept="image/*,video/*"
          multiple
          required
          className="w-full text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Publishing…" : "Publish"}
      </Button>
    </form>
  );
}
