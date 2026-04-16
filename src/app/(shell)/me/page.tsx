import { redirect } from "next/navigation";
import { SupabaseConfigMissing } from "@/components/server/supabase-config-missing";
import { createClient } from "@/lib/supabase/server";

// /me is a convenience alias — always resolves to the signed-in user's
// real profile at /u/[username]. This keeps any hardcoded /me links working.

export default async function MePage() {
  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigMissing />;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.username) {
    // Profile incomplete — middleware should have caught this,
    // but guard here as a safety net.
    redirect("/onboarding");
  }

  redirect(`/u/${profile.username}`);
}
