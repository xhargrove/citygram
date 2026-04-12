"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  display_name: z.string().min(1).max(80),
  home_city_id: z.string().uuid(),
  neighborhood_id: z.string().uuid().optional().nullable(),
  interest_ids: z.array(z.string().uuid()).min(1).max(12),
});

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
    username: formData.get("username"),
    display_name: formData.get("display_name"),
    home_city_id: formData.get("home_city_id"),
    neighborhood_id: neighborhoodId,
    interest_ids,
  });

  if (!parsed.success) {
    return { error: "Check your city, username, and interests" };
  }

  const { username, display_name, home_city_id, neighborhood_id } = parsed.data;

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username_lower", username.toLowerCase())
    .neq("id", user.id)
    .maybeSingle();
  if (taken) return { error: "That handle is already taken" };

  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      username,
      display_name,
      home_city_id,
      neighborhood_id,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (profileErr) return { error: profileErr.message };

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
