"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/feed", label: "Home", icon: HomeIcon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/create", label: "Create", icon: PlusIcon, accent: true },
  { href: "/notifications", label: "Alerts", icon: BellIcon },
  { href: "/me", label: "You", icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/create");

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main
        className={cn(
          "flex-1 feed-scroll",
          hideNav
            ? "safe-pb pb-4"
            : "pb-[calc(env(safe-area-inset-bottom,0px)+4.25rem)]"
        )}
      >
        {children}
      </main>
      {!hideNav && (
        <nav
          className="safe-pb fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md"
          aria-label="Primary"
        >
          <div className="mx-auto flex max-w-lg items-center justify-between px-2 py-2">
            {nav.map((item) => {
              const active =
                item.href === "/feed"
                  ? pathname === "/feed"
                  : item.href === "/me"
                    ? pathname === "/me" || pathname.startsWith("/u/")
                    : item.href === "/explore"
                      ? pathname.startsWith("/explore") ||
                        pathname.startsWith("/passport") ||
                        pathname.startsWith("/city/")
                      : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition-colors",
                    active ? "text-accent" : "text-muted hover:text-foreground",
                    item.accent && "text-accent"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full",
                      item.accent && "bg-accent text-accent-foreground shadow-city"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                  </span>
                  <span className="sr-only sm:not-sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
      />
    </svg>
  );
}

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        d="m14.5 9.5-5 2 2 5 5-2-2-5Z"
      />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M6 10a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7"
      />
      <path strokeWidth="1.8" strokeLinecap="round" d="M10 21h4" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="8" r="3.5" strokeWidth="1.8" />
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M5 20a7 7 0 0 1 14 0"
      />
    </svg>
  );
}
