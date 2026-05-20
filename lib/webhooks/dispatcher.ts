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
  url_mode:    "append_event" | "fixed";
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
      const row = data as Record<string, unknown>;
      _settingsCache = {
        enabled:      data.enabled as boolean,
        base_url:     data.base_url as string | null,
        url_mode:     (row.url_mode as "append_event" | "fixed") ?? "append_event",
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
  // DB event-level URL override (always wins)
  const cfg = settings?.event_config[event];
  if (cfg?.enabled === false) return null;
  if (cfg?.url)               return cfg.url;

  const urlMode = settings?.url_mode ?? "append_event";

  // DB base URL
  const dbBase = settings?.base_url;
  if (dbBase) {
    if (urlMode === "fixed") return dbBase.replace(/\/$/, "");
    // append_event: use event name as-is with underscores (n8n default path style)
    return `${dbBase.replace(/\/$/, "")}/${event}`;
  }

  // Env var per-event override
  const specific = process.env[`N8N_WEBHOOK_${event.toUpperCase()}`];
  if (specific) return specific;

  // Env var base URL fallback
  const envBase = process.env.N8N_WEBHOOK_BASE_URL;
  if (!envBase) return null;
  if (urlMode === "fixed") return envBase.replace(/\/$/, "");
  return `${envBase.replace(/\/$/, "")}/${event}`;
}

/** Returns the URL that would be called for a given event — for UI preview. */
export async function resolveEventUrl(event: WebhookEvent): Promise<string | null> {
  const settings = await getN8nSettings();
  return resolveUrl(event, settings);
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
  responseBody: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin
      .from("webhook_delivery_logs")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        status,
        attempts,
        http_status:     httpStatus,
        response_ms:     responseMs,
        error_message:   errorMessage,
        response_body:   responseBody,
        last_attempt_at: new Date().toISOString(),
      } as any)
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
  let lastResponseBody: string | null = null;
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
          "Content-Type":        "application/json",
          "X-Braxton-Event":     event,
          "X-Braxton-Signature": hmac(body),
          "X-Braxton-Timestamp": Date.now().toString(),
          "User-Agent":          "BraxtonOS/1.0",
        },
        body,
      });

      lastResponseMs = Date.now() - start;
      lastHttpStatus = response.status;

      // Always capture response body (truncated) for debugging 404s and error messages
      try {
        const raw = await response.text();
        lastResponseBody = raw.length > 2000 ? raw.slice(0, 2000) + "…" : raw;
      } catch { /* ignore */ }

      if (response.ok) {
        finalStatus = "success";
        lastError = null;
        break;
      }
      if (response.status >= 400 && response.status < 500) {
        lastError = `HTTP ${response.status}`;
        break; // 4xx: no point retrying
      }
      lastError = `HTTP ${response.status}`;
    } catch (err) {
      lastResponseMs = Date.now() - start;
      lastError = err instanceof Error ? err.message : String(err);
      lastResponseBody = lastError;
    } finally {
      clearTimeout(t);
    }
  }

  if (logId) {
    void updateDeliveryLog(logId, finalStatus, attempts, lastHttpStatus, lastResponseMs, lastError, lastResponseBody);
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
