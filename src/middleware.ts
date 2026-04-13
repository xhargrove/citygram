import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ─── Public routes — no auth required ────────────────────────────────────────
// Exact matches and prefix matches for routes that are always accessible.

const PUBLIC_EXACT = new Set(["/", "/login", "/signup", "/forgot-password"]);
const PUBLIC_PREFIX = ["/auth/"]; // /auth/callback etc.

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIX.some((p) => pathname.startsWith(p));
}

const AUTH_MARKETING = new Set(["/login", "/signup", "/forgot-password"]);

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Signed-out user hitting a protected route → login
  if (!user && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingDone = profile?.onboarding_completed === true;

  // 2. Incomplete onboarding → app routes (except public + /onboarding) → /onboarding
  if (!onboardingDone && pathname !== "/onboarding" && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  // 3. Onboarding complete but still on /onboarding → feed
  if (onboardingDone && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  // 4. Signed-in user on auth/marketing pages (not landing) → onboarding or feed
  if (AUTH_MARKETING.has(pathname)) {
    const dest = onboardingDone ? "/feed" : "/onboarding";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files with extensions (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)).*)",
  ],
};
