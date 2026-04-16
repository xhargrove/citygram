"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { CitygramLogo } from "@/components/brand/citygram-logo";
import { useUnreadNotificationsCount } from "@/hooks/use-unread-notifications-count";
import { cn } from "@/lib/utils";

// ─── Route helpers ────────────────────────────────────────────────────────────

function pathMatchesRoute(pathname: string, route: `/${string}`) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function useHideChrome() {
  const pathname = usePathname();
  return (
    pathMatchesRoute(pathname, "/create") || pathMatchesRoute(pathname, "/onboarding")
  );
}

function useProfileHref() {
  const [href, setHref] = useState<string>("/me");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .limit(1);
      if (error) {
        if (process.env.NODE_ENV === "development") {
          const hint404 =
            error.code === "PGRST205" ||
            (typeof error.message === "string" && error.message.includes("Could not find the table"));
          if (hint404) {
            console.warn(
              "[Citygram] public.profiles is missing from the API (HTTP 404). Apply the schema in " +
                "supabase/migrations/001_citygram_schema.sql via the Supabase SQL Editor, or confirm " +
                "NEXT_PUBLIC_SUPABASE_URL matches the project where you ran the migration."
            );
          }
        }
        return;
      }
      const username = data?.[0]?.username;
      if (username) setHref(`/u/${username}`);
    });
  }, []);

  return href;
}

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  match?: string[];
  isCreate?: boolean;
  icon: (active: boolean) => ReactNode;
};

function buildNavItems(profileHref: string): NavItem[] {
  return [
    {
      href: "/feed",
      label: "My city",
      exact: true,
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          {active ? (
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z" fill="currentColor" />
          ) : (
            <path
              d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5Z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          )}
        </svg>
      ),
    },
    {
      href: "/explore",
      label: "Explore",
      match: ["/explore", "/passport", "/city"],
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          {active ? (
            <>
              <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.15" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
              <path d="M16.5 7.5l-3 6-3 1.5 1.5-3 3-6Z" fill="currentColor" />
            </>
          ) : (
            <>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="M16.5 7.5l-3 6-3 1.5 1.5-3 3-6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      ),
    },
    {
      href: "/create",
      label: "Create",
      exact: true,
      isCreate: true,
      icon: () => (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: "/notifications",
      label: "Alerts",
      exact: true,
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          {active ? (
            <>
              <path d="M6 10a6 6 0 0 1 12 0v3l2 2H4l2-2v-3Z" fill="currentColor" />
              <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" />
            </>
          ) : (
            <>
              <path
                d="M6 10a6 6 0 0 1 12 0v3l2 2H4l2-2v-3Z"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.75" />
            </>
          )}
        </svg>
      ),
    },
    {
      href: profileHref,
      label: "You",
      match: ["/me", "/u"],
      icon: (active) => (
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
          {active ? (
            <>
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="currentColor" opacity="0.6" />
            </>
          ) : (
            <>
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
              <path
                d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      ),
    },
  ];
}

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href;
  if (item.match) {
    return item.match.some((prefix) => pathMatchesRoute(pathname, prefix as `/${string}`));
  }
  return pathname === item.href;
}

function Wordmark() {
  return (
    <Link
      href="/feed"
      className="group flex items-center rounded-xl p-1 outline-none transition-transform focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label="CITYGRAM home"
    >
      <CitygramLogo
        size={36}
        className="rounded-lg shadow-sm ring-1 ring-border/40 transition-[transform,box-shadow] group-hover:scale-[1.03] group-hover:shadow-md group-hover:shadow-accent/15"
        priority
      />
    </Link>
  );
}

function SidebarItem({
  item,
  pathname,
  unreadAlertsCount = 0,
}: {
  item: NavItem;
  pathname: string;
  unreadAlertsCount?: number;
}) {
  const active = isActive(item, pathname);
  const showAlertsBadge = item.href === "/notifications" && unreadAlertsCount > 0;

  if (item.isCreate) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none transition-all",
          "bg-gradient-to-br from-accent via-accent to-teal-700 text-accent-foreground shadow-lg shadow-accent/25",
          "hover:brightness-105 active:scale-[0.98] dark:to-teal-600",
          "focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center">{item.icon(true)}</span>
        <span className="hidden xl:block">{item.label}</span>
      </Link>
    );
  }

  const alertsAriaLabel = showAlertsBadge ? `${item.label}, ${unreadAlertsCount} unread` : item.label;

  return (
    <Link
      href={item.href}
      aria-label={alertsAriaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-gradient-to-r from-accent/12 to-transparent font-semibold text-foreground shadow-sm ring-1 ring-accent/15 before:absolute before:left-1.5 before:top-1/2 before:h-[58%] before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent before:content-['']"
          : "text-muted hover:bg-foreground/5 hover:text-foreground"
      )}
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
        {item.icon(active)}
        {showAlertsBadge ? (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold leading-none text-accent-foreground ring-2 ring-card"
            aria-hidden
          >
            {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
          </span>
        ) : null}
      </span>
      <span className="hidden xl:block">{item.label}</span>
    </Link>
  );
}

function BottomNavItem({
  item,
  pathname,
  unreadAlertsCount = 0,
}: {
  item: NavItem;
  pathname: string;
  unreadAlertsCount?: number;
}) {
  const active = isActive(item, pathname);
  const showAlertsBadge = item.href === "/notifications" && unreadAlertsCount > 0;

  if (item.isCreate) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        className="flex flex-1 flex-col items-center justify-center gap-0.5"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent via-accent to-teal-700 text-accent-foreground shadow-lg shadow-accent/35 ring-2 ring-background ring-offset-2 ring-offset-background transition-transform active:scale-95 dark:to-teal-600">
          {item.icon(true)}
        </span>
      </Link>
    );
  }

  const alertsAriaLabel = showAlertsBadge ? `${item.label}, ${unreadAlertsCount} unread` : item.label;

  return (
    <Link
      href={item.href}
      aria-label={alertsAriaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 pb-1 transition-colors",
        active ? "text-accent" : "text-muted"
      )}
    >
      <span className="relative flex flex-col items-center">
        <span className="relative inline-flex">
          {item.icon(active)}
          {showAlertsBadge ? (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold leading-none text-accent-foreground ring-2 ring-card"
              aria-hidden
            >
              {unreadAlertsCount > 9 ? "9+" : unreadAlertsCount}
            </span>
          ) : null}
        </span>
        {active && (
          <span
            className="absolute -bottom-1.5 h-0.5 w-5 rounded-full bg-accent shadow-[0_0_10px_var(--city-glow)]"
            aria-hidden
          />
        )}
      </span>
      <span className="sr-only text-[10px] font-medium leading-none sm:not-sr-only">{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChrome = useHideChrome();
  const profileHref = useProfileHref();
  const unreadAlertsCount = useUnreadNotificationsCount();
  const navItems = buildNavItems(profileHref);

  return (
    <div className="flex min-h-dvh bg-transparent text-foreground">
      {!hideChrome && (
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col",
            "w-[72px] xl:w-64",
            "border-r border-border/40",
            "bg-card/45 shadow-[inset_-1px_0_0_rgba(15,23,42,0.04)] backdrop-blur-xl backdrop-saturate-150 dark:bg-card/30 dark:shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]",
            "gap-1 px-3 py-5",
            "transition-all duration-200 lg:flex"
          )}
        >
          <div className="mb-6 px-1">
            <Wordmark />
          </div>

          <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
            {navItems.map((item) => (
              <SidebarItem
                key={item.label}
                item={item}
                pathname={pathname}
                unreadAlertsCount={item.href === "/notifications" ? unreadAlertsCount : 0}
              />
            ))}
          </nav>

          <Link
            href="/settings"
            aria-label="Settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-accent/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "text-muted hover:bg-foreground/5 hover:text-foreground",
              pathname === "/settings" &&
                "bg-foreground/10 font-semibold text-foreground ring-1 ring-border/50"
            )}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
              </svg>
            </span>
            <span className="hidden xl:block">Settings</span>
          </Link>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={cn(
            "feed-scroll flex-1",
            !hideChrome &&
              "pb-[calc(env(safe-area-inset-bottom,0px)+4.25rem)] lg:pb-6",
            hideChrome && "safe-pb pb-4"
          )}
        >
          {children}
        </main>
      </div>

      {!hideChrome && (
        <nav
          aria-label="Main navigation"
          className={cn(
            "lg:hidden",
            "fixed bottom-0 left-0 right-0 z-40",
            "flex h-[4.25rem] items-center",
            "rounded-t-3xl border border-b-0 border-border/45",
            "bg-card/90 shadow-[0_-16px_48px_-16px_rgba(15,23,42,0.12)] backdrop-blur-xl backdrop-saturate-150 dark:shadow-[0_-16px_56px_-12px_rgba(0,0,0,0.55)]",
            "safe-pb"
          )}
        >
          <div className="mx-auto flex w-full max-w-lg items-center px-2 pt-1">
            {navItems.map((item) => (
              <BottomNavItem
                key={item.label}
                item={item}
                pathname={pathname}
                unreadAlertsCount={item.href === "/notifications" ? unreadAlertsCount : 0}
              />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
