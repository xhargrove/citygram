import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/** Shell routes use Supabase + cookies; avoid static prerender / dynamic bailout errors. */
export const dynamic = "force-dynamic";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
