"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { usernameSlugFromNames } from "@/lib/utils";

const schema = z
  .object({
    first_name: z.string().trim().min(1).max(60),
    last_name: z.string().trim().min(1).max(60),
    display_name: z.string().trim().min(1).max(80),
    home_city_id: z.string().uuid(),
    neighborhood_id: z.string().uuid().optional().nullable(),
    interest_ids: z.array(z.string().uuid()).min(1).max(12),
  })
  .refine((d) => `${d.first_name} ${d.last_name}`.length <= 120, {
    message: "First and last name combined are too long",
  });

export type OnboardingState = { error?: string; ok?: boolean };

async function allocateUsernameFromNames(
  supabase: SupabaseClient,
  userId: string,
  firstName: string,
  lastName: string
): Promise<{ username: string } | { error: string }> {
  const base = usernameSlugFromNames(firstName, lastName);

  for (let n = 0; n < 100; n++) {
    const suffix = n === 0 ? "" : `_${n}`;
    const room = Math.max(1, 30 - suffix.length);
    const candidate = (base.slice(0, room) + suffix).slice(0, 30);
    if (candidate.length < 3) continue;

    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username_lower", candidate.toLowerCase())
      .neq("id", userId)
      .maybeSingle();

    if (!taken) return { username: candidate };
  }

  return { error: "Could not reserve a handle from your name. Try shortening or adjusting spelling." };
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const interestKeys = formData.getAll("interests") as string[];
  const { data: interestRows } = await supabase
    .from("interests")
    .select("id")
    .in("key", interestKeys);
  const interest_ids = interestRows?.map((i) => i.id) ?? [];

  const hoodRaw = formData.get("neighborhood_id");
  const neighborhoodId =
    typeof hoodRaw === "string" && hoodRaw.length > 0 ? hoodRaw : null;

  const parsed = schema.safeParse({
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    display_name: formData.get("display_name"),
    home_city_id: formData.get("home_city_id"),
    neighborhood_id: neighborhoodId,
    interest_ids,
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    if (msg.first_name?.[0] || msg.last_name?.[0]) {
      return { error: "Enter your first and last name" };
    }
    if (msg.display_name?.[0]) {
      return { error: "Enter your site name (how you appear on Citygram)" };
    }
    if (parsed.error.issues.some((e) => e.message.includes("combined"))) {
      return { error: "First and last name combined are too long" };
    }
    return { error: "Check your city, names, site name, and interests" };
  }

  const { first_name, last_name, display_name, home_city_id, neighborhood_id } =
    parsed.data;

  const handle = await allocateUsernameFromNames(supabase, user.id, first_name, last_name);
  if ("error" in handle) return { error: handle.error };
  const { username } = handle;

  const row = {
    username,
    display_name,
    first_name,
    last_name,
    home_city_id,
    neighborhood_id,
    onboarding_completed: true as const,
  };

  const { data: updatedProfile, error: profileErr } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (profileErr) return { error: profileErr.message };

  if (!updatedProfile) {
    const { data: inserted, error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: user.id, ...row })
      .select("id")
      .maybeSingle();

    if (insertErr) return { error: insertErr.message };
    if (!inserted) {
      return {
        error:
          "Could not create your profile. Confirm supabase/migrations/001_citygram_schema.sql is applied and profiles RLS allows insert for your account.",
      };
    }
  }

  await supabase.from("profile_interests").delete().eq("profile_id", user.id);
  const rows = parsed.data.interest_ids.map((interest_id) => ({
    profile_id: user.id,
    interest_id,
  }));
  const { error: piErr } = await supabase.from("profile_interests").insert(rows);
  if (piErr) return { error: piErr.message };

  revalidatePath("/feed");
  return { ok: true };
}
