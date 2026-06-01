import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, retryDelivery } from "@/lib/webhooks/dispatcher";

/**
 * POST /api/webhooks/cron/retry-failed
 *
 * Re-attempts failed webhook deliveries using the stored URL and body.
 * Updates the original log row — does NOT create duplicate log entries.
 *
 * Eligibility: status = 'failed', attempts < 6, created_at within 24h
 * Security: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!verifyCronSecret(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: failedLogs, error: fetchErr } = await admin
    .from("webhook_delivery_logs")
    .select("id")
    .eq("status", "failed")
    .lt("attempts", 6)
    .gte("created_at", since);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let retried      = 0;
  let succeeded    = 0;
  let still_failed = 0;

  for (const log of failedLogs ?? []) {
    retried++;
    const result = await retryDelivery(log.id);
    if (result.ok) succeeded++;
    else           still_failed++;
  }

  return NextResponse.json({ retried, succeeded, still_failed });
}
