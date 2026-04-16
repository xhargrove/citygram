"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Unread in-app notifications for the signed-in user (`read = false`).
 * Refetches on route changes and on a light interval so Alerts badge stays fresh after “Mark read”.
 */
export function useUnreadNotificationsCount(): number {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      return;
    }

    const { count: n, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);

    if (error) {
      setCount(0);
      return;
    }
    setCount(n ?? 0);
  }, []);

  useEffect(() => {
    void fetchCount();
  }, [fetchCount, pathname]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchCount();
    }, 45_000);
    return () => window.clearInterval(id);
  }, [fetchCount]);

  useEffect(() => {
    const onFocus = () => {
      void fetchCount();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchCount]);

  return count;
}
