import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "ai_mock_mode";
const COOKIE_OPTS = {
  httpOnly: false,        // readable by JS so the UI can reflect current state
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

/**
 * GET /api/ai/mock-mode
 * Returns current mock mode status:
 * { mock: boolean, reason: "no_api_key" | "env_override" | "user_toggle" | "disabled" }
 */
export async function GET() {
  const hasKey  = !!process.env.ANTHROPIC_API_KEY;
  const envForce = process.env.AI_MOCK_MODE === "true";
  const store   = await cookies();
  const cookieOn = store.get(COOKIE_NAME)?.value === "true";

  const mock = !hasKey || envForce || cookieOn;
  const reason = !hasKey      ? "no_api_key"
               : envForce     ? "env_override"
               : cookieOn     ? "user_toggle"
               : "disabled";

  return NextResponse.json({ mock, reason, cookie: cookieOn, has_api_key: hasKey });
}

/**
 * POST /api/ai/mock-mode
 * Body: { enabled: boolean }
 * Toggles user-level mock mode via cookie (cannot override env/key absence).
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { enabled?: unknown };
  const enabled = Boolean(body.enabled);

  const res = NextResponse.json({ ok: true, mock: enabled });
  if (enabled) {
    res.cookies.set(COOKIE_NAME, "true", COOKIE_OPTS);
  } else {
    res.cookies.set(COOKIE_NAME, "false", { ...COOKIE_OPTS, maxAge: 0 });
  }
  return res;
}
