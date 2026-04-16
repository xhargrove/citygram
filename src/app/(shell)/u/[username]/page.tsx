import Link from "next/link";
import { notFound } from "next/navigation";
import { FollowButton } from "@/components/profile/follow-button";
import { PostGrid } from "@/components/profile/post-grid";
import { ProfileAvatarUpload } from "@/components/profile/profile-avatar-upload";
import { Avatar } from "@/components/media/avatar";
import {
  fetchFollowCounts,
  fetchPostThumbnailsForIds,
  fetchProfilePostThumbs,
  fetchPublicProfile,
  fetchSavedPosts,
  fetchTaggedPosts,
  isFollowing,
} from "@/lib/data/profile";
import { SupabaseConfigMissing } from "@/components/server/supabase-config-missing";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  const { tab } = await searchParams;

  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigMissing />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await fetchPublicProfile(supabase, username);
  if (!profile) notFound();

  const isSelf = user.id === profile.id;

  const activeTab =
    tab === "saved" && isSelf ? "saved" : tab === "tagged" ? "tagged" : "posts";

  const [counts, following] = await Promise.all([
    fetchFollowCounts(supabase, profile.id),
    isSelf ? Promise.resolve(false) : isFollowing(supabase, user.id, profile.id),
  ]);

  let gridItems = await fetchProfilePostThumbs(supabase, profile.id);

  if (activeTab === "saved" && isSelf) {
    const saved = await fetchSavedPosts(supabase, user.id);
    gridItems = await fetchPostThumbnailsForIds(
      supabase,
      saved.map((s) => s.id)
    );
  }

  if (activeTab === "tagged") {
    const tagged = await fetchTaggedPosts(supabase, profile.id);
    gridItems = await fetchPostThumbnailsForIds(
      supabase,
      tagged.map((t) => t.id)
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="border-b border-border px-4 pb-4 pt-6 safe-pt">
        <div className="flex gap-4">
          <div className="flex shrink-0 flex-col items-center gap-2">
            <Avatar src={profile.avatar_url} alt={profile.display_name} size="lg" />
            {isSelf && (
              <ProfileAvatarUpload
                userId={user.id}
                hasAvatar={Boolean(profile.avatar_url)}
                compact
              />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold">{profile.display_name}</h1>
              {profile.account_type === "creator" && (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  Creator
                </span>
              )}
              {profile.account_type === "business" && (
                <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  Local business
                </span>
              )}
            </div>
            <p className="text-sm text-muted">@{profile.username}</p>
            {profile.city && (
              <p className="text-sm">
                <span className="text-muted">Home city:</span>{" "}
                <Link href={`/city/${profile.city.slug}`} className="font-semibold text-accent">
                  {profile.city.name}
                </Link>
                {profile.neighborhood && (
                  <span className="text-muted"> · {profile.neighborhood.name}</span>
                )}
              </p>
            )}
            {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}
            <div className="flex gap-4 text-sm">
              <p>
                <span className="font-semibold">{counts.followers}</span>{" "}
                <span className="text-muted">followers</span>
              </p>
              <p>
                <span className="font-semibold">{counts.following}</span>{" "}
                <span className="text-muted">following</span>
              </p>
            </div>
            {!isSelf && (
              <FollowButton username={profile.username} initialFollowing={following} />
            )}
            {isSelf && (
              <Link
                href="/settings"
                className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"
              >
                Edit profile
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-t border-border pt-4 text-sm font-semibold">
          <TabLink href={`/u/${profile.username}`} active={activeTab === "posts"} label="Posts" />
          {isSelf && (
            <TabLink
              href={`/u/${profile.username}?tab=saved`}
              active={activeTab === "saved"}
              label="Saved"
            />
          )}
          <TabLink
            href={`/u/${profile.username}?tab=tagged`}
            active={activeTab === "tagged"}
            label="Tagged"
          />
        </div>
      </header>

      {activeTab === "tagged" && (
        <p className="px-4 py-3 text-xs text-muted">
          Tags ship when mentions roll out broadly — today this tab stays ready for your city crew.
        </p>
      )}

      <PostGrid items={gridItems} />
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-2 ${active ? "bg-foreground/10 text-foreground" : "text-muted"}`}
    >
      {label}
    </Link>
  );
}
