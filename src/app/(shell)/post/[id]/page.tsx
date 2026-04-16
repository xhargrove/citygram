import Link from "next/link";
import { PostCard } from "@/components/feed/post-card";
import { CommentThread } from "@/components/post/comment-thread";
import { SupabaseConfigMissing } from "@/components/server/supabase-config-missing";
import { fetchComments } from "@/lib/data/comments";
import { fetchPostById } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) return <SupabaseConfigMissing />;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const post = await fetchPostById(supabase, id, user.id);
  if (!post) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg px-4 py-14 text-center">
        <p className="font-display text-lg font-semibold text-foreground">This post isn&apos;t available</p>
        <p className="mt-2 text-sm text-muted">It may have been removed, or there was a problem loading it.</p>
        <Link href="/feed" className="mt-6 inline-block text-sm font-semibold text-accent">
          Back to feed
        </Link>
      </div>
    );
  }

  const comments = await fetchComments(supabase, id);

  return (
    <div className="mx-auto min-h-dvh max-w-lg pb-8">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur safe-pt">
        <Link href="/feed" className="min-h-10 min-w-10 rounded-full text-lg">
          ←
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">Post</p>
          <p className="font-display text-lg font-semibold">Thread</p>
        </div>
      </header>
      <PostCard post={post} priorityImage />
      <CommentThread postId={post.id} initial={comments} />
    </div>
  );
}
