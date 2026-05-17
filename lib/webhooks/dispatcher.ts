import { createHmac } from "crypto";

// ─── Event registry ──────────────────────────────────────────────────────────

export const WEBHOOK_EVENTS = [
  "new_contact",         // New CRM contact created
  "hot_lead",            // AI qualification scored as hot
  "outreach_reply",      // Outreach lead replied (positive or replied)
  "website_lead",        // Lead submitted via website form webhook
  "overdue_followup",    // CRM contact follow-up date passed
  "task_overdue",        // Task past its due date
  "deal_stage_changed",  // Deal moved to a new stage
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

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
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
  } catch {
    // Webhook failure must never break the main request
  } finally {
    clearTimeout(t);
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
