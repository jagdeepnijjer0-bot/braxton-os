import "server-only";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Event registry ──────────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
  "new_contact",         // New CRM contact created
  "hot_lead",            // AI qualification scored as hot
  "outreach_reply",      // Outreach lead replied (positive or replied)
  "website_lead",        // Lead submitted via website form webhook
  "overdue_followup",    // CRM contact follow-up date passed
  "task_overdue",        // Task past its due date
  "deal_stage_changed",  // Deal moved to a new stage
  // New in Phase 3B
  "lead_updated",        // CRM contact updated
  "task_created",        // New task created
  "message_received",    // New inbound message received
  "deal_updated",        // Deal record updated
  "file_uploaded",       // File attachment uploaded
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ─── Signing ─────────────────────────────────────────────────────────────────

function hmac(body: string): string {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return "";
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

/** Constant-time comparison to prevent timing attacks */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── URL resolution ───────────────────────────────────────────────────────────

function resolveUrl(event: WebhookEvent): string | null {
  // Per-event override: N8N_WEBHOOK_NEW_CONTACT, N8N_WEBHOOK_HOT_LEAD, etc.
  const specific = process.env[`N8N_WEBHOOK_${event.toUpperCase()}`];
  if (specific) return specific;

  // Fall back to base URL + event slug
  const base = process.env.N8N_WEBHOOK_BASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/${event.replace(/_/g, "-")}`;
}

// ─── Delivery log helpers ─────────────────────────────────────────────────────

async function createDeliveryLog(event: WebhookEvent, url: string, requestBody: string): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("webhook_delivery_logs")
      .insert({
        event,
        url,
        status:       "pending",
        attempts:     0,
        request_body: JSON.parse(requestBody) as Record<string, unknown>,
      })
      .select("id")
      .single();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

async function updateDeliveryLog(
  logId: string,
  status: "success" | "failed",
  attempts: number,
  httpStatus: number | null,
  responseMs: number | null,
  errorMessage: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("webhook_delivery_logs")
      .update({
        status,
        attempts,
        http_status:      httpStatus,
        response_ms:      responseMs,
        error_message:    errorMessage,
        last_attempt_at:  new Date().toISOString(),
      })
      .eq("id", logId);
  } catch {
    // Never block main flow
  }
}

// ─── Outbound dispatcher ──────────────────────────────────────────────────────

export async function dispatchWebhook(
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  if (process.env.N8N_ENABLED !== "true") return;

  const url = resolveUrl(event);
  if (!url) return;

  const body = JSON.stringify({
    event,
    timestamp: Date.now(),
    source: "braxton-os",
    data,
  });

  // Write pending delivery log row (fire-and-forget)
  const logId = await createDeliveryLog(event, url, body);

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS = [0, 1000, 2000]; // ms before each attempt

  let lastHttpStatus: number | null = null;
  let lastError: string | null = null;
  let lastResponseMs: number | null = null;
  let finalStatus: "success" | "failed" = "failed";
  let attempts = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    // Wait before retry (delay[0] = 0 so first attempt is immediate)
    if (RETRY_DELAYS[i] > 0) {
      await new Promise((res) => setTimeout(res, RETRY_DELAYS[i]));
    }

    attempts = i + 1;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "X-Braxton-Event": event,
          "X-Braxton-Signature": hmac(body),
          "X-Braxton-Timestamp": Date.now().toString(),
          "User-Agent": "BraxtonOS/1.0",
        },
        body,
      });

      lastResponseMs = Date.now() - start;
      lastHttpStatus = response.status;

      if (response.ok) {
        // 2xx — success, stop retrying
        finalStatus = "success";
        lastError = null;
        break;
      }

      if (response.status >= 400 && response.status < 500) {
        // 4xx client error — don't retry
        lastError = `HTTP ${response.status}`;
        break;
      }

      // 5xx — will retry
      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastResponseMs = Date.now() - start;
      lastError = err instanceof Error ? err.message : String(err);
    } finally {
      clearTimeout(t);
    }
  }

  // Update log row after final attempt (fire-and-forget)
  if (logId) {
    void updateDeliveryLog(logId, finalStatus, attempts, lastHttpStatus, lastResponseMs, lastError);
  }
}

// ─── Inbound verification ─────────────────────────────────────────────────────

/** Verify a signature on an inbound webhook from n8n */
export function verifyInboundSignature(rawBody: string, headerSig: string): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = hmac(rawBody);
  return safeEqual(expected, headerSig);
}

/** Verify the Authorization: Bearer <CRON_SECRET> header on cron endpoints */
export function verifyCronSecret(authHeader: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return safeEqual(authHeader, `Bearer ${secret}`);
}
