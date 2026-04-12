"use client";

import { useOptimistic, useTransition } from "react";
import { toggleFollow } from "@/actions/social";
import { Button } from "@/components/ui/button";

type Props = {
  username: string;
  initialFollowing: boolean;
};

export function FollowButton({ username, initialFollowing }: Props) {
  const [pending, startTransition] = useTransition();
  const [optimistic, addOptimistic] = useOptimistic(
    initialFollowing,
    (_state, next: boolean) => next
  );

  function onClick() {
    startTransition(async () => {
      addOptimistic(!optimistic);
      await toggleFollow(username);
    });
  }

  return (
    <Button
      type="button"
      variant={optimistic ? "outline" : "primary"}
      size="sm"
      className="min-h-11 px-5"
      onClick={onClick}
      disabled={pending}
    >
      {optimistic ? "Following" : "Follow"}
    </Button>
  );
}
