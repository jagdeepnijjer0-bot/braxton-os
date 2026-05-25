import { NextRequest, NextResponse } from "next/server";
import { validateDemoSession, DEMO_COOKIE } from "@/lib/demo/session";

/**
 * GET /api/demo/session
 *
 * Validates the demo session cookie. Returns session metadata (without token).
 * Used by client-side workspace pages to check auth state.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(DEMO_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const session = await validateDemoSession(token);
  if (!session) {
    return NextResponse.json({ valid: false, reason: "expired_or_invalid" }, { status: 401 });
  }

  const { token: _t, ...safe } = session;
  return NextResponse.json({ valid: true, session: safe });
}
