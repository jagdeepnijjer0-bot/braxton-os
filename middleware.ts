import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass through Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    /\.(ico|png|jpg|jpeg|svg|webp|css|js)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const { res, user } = await updateSession(req);

  // Unauthenticated → redirect to /login (except already on public paths)
  if (!user && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated + going to /login → redirect home
  if (user && PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  // Run on every path except Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
