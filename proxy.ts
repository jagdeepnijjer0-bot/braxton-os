import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// These paths are accessible without being logged in
const PUBLIC_PATHS = ["/login", "/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always pass through Next.js internals, static assets and auth API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    /\.(ico|png|jpg|jpeg|svg|webp|woff2?|ttf|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Try to get the current session — if Supabase errors, fail open on public
  // paths and fail closed (redirect to /login) on protected paths.
  let user = null;
  let res  = NextResponse.next();

  try {
    const result = await updateSession(req);
    user = result.user;
    res  = result.res;
  } catch {
    // Supabase unavailable — let public paths through, block protected ones
    if (!isPublic) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Unauthenticated user trying to access a protected page → /login
  if (!user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated user landing on a public auth page → dashboard
  if (user && isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *   - _next/static  (static files)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
