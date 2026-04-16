import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { SupabaseConfigMissing } from "@/components/server/supabase-config-missing";
import { createClient } from "@/lib/supabase/server";
import type { CityRow, InterestRow } from "@/types/database";

export default async function OnboardingPage() {
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigMissing />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.onboarding_completed) redirect("/feed");

  const [{ data: cities }, { data: interests }] = await Promise.all([
    supabase.from("cities").select("*").order("name"),
    supabase.from("interests").select("*").order("label"),
  ]);

  const cityRows = (cities ?? []) as CityRow[];
  const interestRows = (interests ?? []) as InterestRow[];

  if (!cityRows.length || !interestRows.length) {
    return (
      <div className="px-6 py-16 text-center text-sm text-muted">
        Seed cities and interests in Supabase, then refresh this page.
      </div>
    );
  }

  return <OnboardingForm cities={cityRows} interests={interestRows} />;
}
