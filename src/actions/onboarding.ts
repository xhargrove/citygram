"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z
  .object({
    first_name: z.string().trim().min(1).max(60),
    last_name: z.string().trim().min(1).max(60),
    username: z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/),
    home_city_id: z.string().uuid(),
    neighborhood_id: z.string().uuid().optional().nullable(),
    interest_ids: z.array(z.string().uuid()).min(1).max(12),
  })
  .refine(
    (d) => `${d.first_name} ${d.last_name}`.length <= 80,
    { message: "Full name is too long (max 80 characters)" }
  );

export type OnboardingState = { error?: string; ok?: boolean };

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
    username: formData.get("username"),
    home_city_id: formData.get("home_city_id"),
    neighborhood_id: neighborhoodId,
    interest_ids,
  });

  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    if (msg.first_name?.[0] || msg.last_name?.[0]) {
      return { error: "Enter your first and last name" };
    }
    if (parsed.error.issues.some((e) => e.message.includes("80"))) {
      return { error: "Full name is too long (max 80 characters)" };
    }
    return { error: "Check your city, name, handle, and interests" };
  }

  const { first_name, last_name, username, home_city_id, neighborhood_id } = parsed.data;
  const display_name = `${first_name} ${last_name}`;

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username_lower", username.toLowerCase())
    .neq("id", user.id)
    .maybeSingle();
  if (taken) return { error: "That handle is already taken" };

  const row = {
    username,
    display_name,
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
