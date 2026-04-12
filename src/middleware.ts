import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const publicPaths = new Set([
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/callback",
]);

const authOnlyPaths = new Set(["/login", "/signup", "/forgot-password"]);

function isPublicPath(pathname: string) {
  if (publicPaths.has(pathname)) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

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
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (!isPublicPath(pathname) && pathname !== "/onboarding") {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return response;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  const onboardingDone = profile?.onboarding_completed === true;

  if (!onboardingDone && pathname !== "/onboarding" && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (onboardingDone && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (authOnlyPaths.has(pathname)) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
