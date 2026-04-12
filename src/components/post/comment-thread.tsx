"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/actions/social";
import { Avatar } from "@/components/media/avatar";
import type { CommentWithAuthor } from "@/lib/data/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  postId: string;
  initial: CommentWithAuthor[];
};

export function CommentThread({ postId, initial }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      const body = String(formData.get("body") ?? "");
      const res = await addComment(postId, body);
      if (res.error) return { error: res.error };
      formRef.current?.reset();
      router.refresh();
      return {};
    },
    {}
  );

  return (
    <section id="comments" className="border-t border-border px-4 py-6">
      <h2 className="font-display text-lg font-semibold">Comments</h2>
      <form ref={formRef} action={formAction} className="mt-4 space-y-3">
        <Textarea name="body" placeholder="Say something kind…" rows={3} required />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Posting…" : "Post"}
        </Button>
      </form>
      <ul className="mt-6 space-y-4">
        {initial.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Avatar src={c.author.avatar_url} alt={c.author.display_name} size="sm" />
            <div>
              <p className="text-sm font-semibold">
                {c.author.display_name}{" "}
                <span className="font-normal text-muted">@{c.author.username}</span>
              </p>
              <p className="text-sm leading-relaxed">{c.body}</p>
            </div>
          </li>
        ))}
        {initial.length === 0 && (
          <li className="text-sm text-muted">Be the first to start the conversation.</li>
        )}
      </ul>
    </section>
  );
}
