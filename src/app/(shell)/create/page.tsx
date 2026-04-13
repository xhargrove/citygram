import Link from "next/link";
import { redirect } from "next/navigation";
import { CreatePostForm } from "@/components/create/create-post-form";
import { createClient } from "@/lib/supabase/server";

export default async function CreatePostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("home_city_id, neighborhood_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.home_city_id) redirect("/onboarding");

  const { data: homeCity } = await supabase
    .from("cities")
    .select("id, name")
    .eq("id", profile.home_city_id)
    .maybeSingle();

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur safe-pt">
        <Link href="/feed" className="min-h-10 min-w-10 rounded-full text-lg">
          ←
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">New post</p>
          <p className="font-display text-lg font-semibold">Create</p>
          <p className="text-xs text-muted">For your home city</p>
        </div>
      </header>
      <CreatePostForm
        homeCityId={profile.home_city_id}
        homeCityName={homeCity?.name ?? "Your home city"}
        defaultNeighborhoodId={profile.neighborhood_id}
      />
    </div>
  );
}
