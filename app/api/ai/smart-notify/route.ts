import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { runSmartNotificationSweep } from "@/lib/ai/smart-notifications";
import { isMockMode } from "@/lib/ai/is-mock";

/**
 * POST /api/ai/smart-notify
 * Runs the smart notification sweep:
 * - overdue follow-ups
 * - hot leads going cold
 * - overdue tasks
 */
export async function POST(_req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [result, mock] = await Promise.all([runSmartNotificationSweep(), isMockMode()]);
    return NextResponse.json({ ok: true, mock, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
