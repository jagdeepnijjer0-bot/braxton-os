import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret, dispatchWebhook } from "@/lib/webhooks/dispatcher";
import type { WebhookEvent } from "@/lib/webhooks/dispatcher";

/**
 * POST /api/webhooks/cron/retry-failed
 *
 * Re-dispatches failed webhook deliveries.
 * Fetches all webhook_delivery_logs where:
 *   status = 'failed' AND attempts < 3 AND created_at > now() - 24h
 *
 * Security: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!verifyCronSecret(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Fetch failed logs eligible for retry (< 3 attempts, within 24h)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: failedLogs, error: fetchErr } = await admin
    .from("webhook_delivery_logs")
    .select("id, event, url, request_body, attempts")
    .eq("status", "failed")
    .lt("attempts", 3)
    .gte("created_at", since);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  let retried      = 0;
  let succeeded    = 0;
  let still_failed = 0;

  for (const log of failedLogs ?? []) {
    retried++;
    const start = Date.now();
    let httpStatus: number | null = null;
    let errorMsg:   string | null = null;
    let success = false;

    try {
      // Re-dispatch using the stored event and request_body data
      const data = (log.request_body as { data?: Record<string, unknown> })?.data ?? {};
      await dispatchWebhook(log.event as WebhookEvent, data);
      // If dispatchWebhook didn't throw, treat as initiated (it handles its own retry/logging)
      success = true;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    }

    const responseMs = Date.now() - start;

    // Update the log row
    try {
      await admin
        .from("webhook_delivery_logs")
        .update({
          status:          success ? "success" : "failed",
          attempts:        (log.attempts ?? 0) + 1,
          http_status:     httpStatus,
          response_ms:     responseMs,
          error_message:   errorMsg,
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", log.id);
    } catch {
      // Never block
    }

    if (success) {
      succeeded++;
    } else {
      still_failed++;
    }
  }

  return NextResponse.json({ retried, succeeded, still_failed });
}
