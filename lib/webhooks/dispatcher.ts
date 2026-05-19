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
  "lead_updated",        // CRM contact updated
  "task_created",        // New task created
  "message_received",    // New inbound message received
  "deal_updated",        // Deal record updated
  "file_uploaded",       // File attachment uploaded
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// ─── DB settings cache ────────────────────────────────────────────────────────

interface N8nEventCfg { url?: string | null; enabled?: boolean }

interface N8nSettings {
  enabled:     boolean;
  base_url:    string | null;
  event_config: Record<string, N8nEventCfg>;
}

let _settingsCache: N8nSettings | null = null;
let _settingsCacheAt = 0;
const CACHE_TTL = 60_000;

export async function getN8nSettings(): Promise<N8nSettings | null> {
  const now = Date.now();
  if (_settingsCache && now - _settingsCacheAt < CACHE_TTL) return _settingsCache;
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("n8n_settings").select("*").limit(1).single();
    if (data) {
      _settingsCache = {
        enabled:      data.enabled as boolean,
        base_url:     data.base_url as string | null,
        event_config: (data.event_config as Record<string, N8nEventCfg>) ?? {},
      };
      _settingsCacheAt = now;
      return _settingsCache;
    }
  } catch {
    // Fall back to env vars
  }
  return null;
}

export function invalidateN8nSettingsCache() {
  _settingsCache = null;
  _settingsCacheAt = 0;
}

// ─── Signing ─────────────────────────────────────────────────────────────────

function hmac(body: string, secret?: string): string {
  const s = secret ?? process.env.N8N_WEBHOOK_SECRET;
  if (!s) return "";
  return "sha256=" + createHmac("sha256", s).update(body).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ─── URL resolution ───────────────────────────────────────────────────────────

function resolveUrl(event: WebhookEvent, settings: N8nSettings | null): string | null {
  // DB event-level override
  const cfg = settings?.event_config[event];
  if (cfg?.enabled === false) return null; // explicitly disabled
  if (cfg?.url)               return cfg.url;

  // DB base URL
  const dbBase = settings?.base_url;
  if (dbBase) return `${dbBase.replace(/\/$/, "")}/${event.replace(/_/g, "-")}`;

  // Env var per-event override
  const specific = process.env[`N8N_WEBHOOK_${event.toUpperCase()}`];
  if (specific) return specific;

  // Env var base URL fallback
  const envBase = process.env.N8N_WEBHOOK_BASE_URL;
  if (!envBase) return null;
  return `${envBase.replace(/\/$/, "")}/${event.replace(/_/g, "-")}`;
}

function isEnabled(settings: N8nSettings | null): boolean {
  if (settings !== null) return settings.enabled;
  return process.env.N8N_ENABLED === "true";
}

// ─── Delivery log helpers ─────────────────────────────────────────────────────

async function createDeliveryLog(
  event: WebhookEvent,
  url: string,
  requestBody: string,
): Promise<string | null> {
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
        http_status:     httpStatus,
        response_ms:     responseMs,
        error_message:   errorMessage,
        last_attempt_at: new Date().toISOString(),
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
  const settings = await getN8nSettings();
  if (!isEnabled(settings)) return;

  const url = resolveUrl(event, settings);
  if (!url) return;

  const body = JSON.stringify({
    event,
    timestamp: Date.now(),
    source: "braxton-os",
    data,
  });

  const logId = await createDeliveryLog(event, url, body);

  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS = [0, 1000, 2000];

  let lastHttpStatus: number | null = null;
  let lastError: string | null = null;
  let lastResponseMs: number | null = null;
  let finalStatus: "success" | "failed" = "failed";
  let attempts = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (RETRY_DELAYS[i] > 0) await new Promise(r => setTimeout(r, RETRY_DELAYS[i]));

    attempts = i + 1;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type":       "application/json",
          "X-Braxton-Event":    event,
          "X-Braxton-Signature": hmac(body),
          "X-Braxton-Timestamp": Date.now().toString(),
          "User-Agent":         "BraxtonOS/1.0",
        },
        body,
      });

      lastResponseMs = Date.now() - start;
      lastHttpStatus = response.status;

      if (response.ok) {
        finalStatus = "success";
        lastError = null;
        break;
      }
      if (response.status >= 400 && response.status < 500) {
        lastError = `HTTP ${response.status}`;
        break;
      }
      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastResponseMs = Date.now() - start;
      lastError = err instanceof Error ? err.message : String(err);
    } finally {
      clearTimeout(t);
    }
  }

  if (logId) {
    void updateDeliveryLog(logId, finalStatus, attempts, lastHttpStatus, lastResponseMs, lastError);
  }
}

// ─── Inbound verification ─────────────────────────────────────────────────────

export function verifyInboundSignature(rawBody: string, headerSig: string): boolean {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(hmac(rawBody), headerSig);
}

export function verifyCronSecret(authHeader: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return safeEqual(authHeader, `Bearer ${secret}`);
}
