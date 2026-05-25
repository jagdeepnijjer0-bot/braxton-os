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
  "demo_access_created", // Demo user registered
  "demo_high_intent",    // Demo engagement scored high
  "demo_package_reserved", // Demo user reserved a package
  "demo_book_call_clicked", // Demo user clicked book a call
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

// ─── Core HTTP delivery (shared by dispatch and retry) ───────────────────────

interface DeliveryResult {
  finalStatus:   "success" | "failed";
  attempts:      number;
  httpStatus:    number | null;
  responseMs:    number | null;
  errorMessage:  string | null;
  responseBody:  string | null;
}

async function executeDelivery(
  url: string,
  body: string,
  event: WebhookEvent,
  label = "dispatch",
): Promise<DeliveryResult> {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS = [0, 1000, 2000];

  // Validate inputs loudly before touching the network
  if (!url || typeof url !== "string") {
    console.error(`[dispatcher:${label}] ABORT — url is empty or not a string:`, JSON.stringify(url));
    return { finalStatus: "failed", attempts: 0, httpStatus: null, responseMs: null, errorMessage: "url missing", responseBody: null };
  }
  if (!body || typeof body !== "string") {
    console.error(`[dispatcher:${label}] ABORT — body is empty or not a string`);
    return { finalStatus: "failed", attempts: 0, httpStatus: null, responseMs: null, errorMessage: "body missing", responseBody: null };
  }

  // Verify body is valid JSON (catches double-stringify and other corruption)
  try { JSON.parse(body); } catch {
    console.error(`[dispatcher:${label}] ABORT — body is not valid JSON:`, body.slice(0, 200));
    return { finalStatus: "failed", attempts: 0, httpStatus: null, responseMs: null, errorMessage: "body is not valid JSON", responseBody: null };
  }

  console.log(`[dispatcher:${label}] ── START ──────────────────────────────`);
  console.log(`[dispatcher:${label}] Method : POST`);
  console.log(`[dispatcher:${label}] URL    : ${url}`);
  console.log(`[dispatcher:${label}] Event  : ${event}`);
  console.log(`[dispatcher:${label}] Body   : ${body.slice(0, 500)}${body.length > 500 ? "…" : ""}`);
  console.log(`[dispatcher:${label}] Headers: Content-Type=application/json  X-Braxton-Event=${event}  User-Agent=BraxtonOS/1.0`);

  let lastHttpStatus: number | null = null;
  let lastError: string | null = null;
  let lastResponseMs: number | null = null;
  let lastResponseBody: string | null = null;
  let finalStatus: "success" | "failed" = "failed";
  let attempts = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (RETRY_DELAYS[i] > 0) {
      console.log(`[dispatcher:${label}] Waiting ${RETRY_DELAYS[i]}ms before attempt ${i + 1}`);
      await new Promise(r => setTimeout(r, RETRY_DELAYS[i]));
    }

    attempts = i + 1;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const start = Date.now();

    console.log(`[dispatcher:${label}] Attempt ${attempts}/${MAX_ATTEMPTS} → POST ${url}`);

    try {
      const fetchOptions = {
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
      };

      const response = await fetch(url, fetchOptions);

      lastResponseMs = Date.now() - start;
      lastHttpStatus = response.status;

      try {
        const raw = await response.text();
        lastResponseBody = raw.length > 2000 ? raw.slice(0, 2000) + "…" : raw;
      } catch { /* ignore */ }

      console.log(`[dispatcher:${label}] Attempt ${attempts} → HTTP ${response.status} (${lastResponseMs}ms) body: ${lastResponseBody?.slice(0, 200)}`);

      if (response.ok) {
        finalStatus = "success";
        lastError = null;
        console.log(`[dispatcher:${label}] ✓ SUCCESS on attempt ${attempts}`);
        break;
      }
      if (response.status >= 400 && response.status < 500) {
        lastError = `HTTP ${response.status}`;
        console.warn(`[dispatcher:${label}] ✗ 4xx — not retrying. Response: ${lastResponseBody?.slice(0, 300)}`);
        break;
      }
      lastError = `HTTP ${response.status}`;
      console.warn(`[dispatcher:${label}] ✗ 5xx on attempt ${attempts} — will retry`);
    } catch (err) {
      lastResponseMs = Date.now() - start;
      lastError = err instanceof Error ? err.message : String(err);
      lastResponseBody = lastError;
      console.error(`[dispatcher:${label}] ✗ fetch threw on attempt ${attempts}:`, lastError);
    } finally {
      clearTimeout(t);
    }
  }

  console.log(`[dispatcher:${label}] ── END finalStatus=${finalStatus} httpStatus=${lastHttpStatus} ──`);
  return { finalStatus, attempts, httpStatus: lastHttpStatus, responseMs: lastResponseMs, errorMessage: lastError, responseBody: lastResponseBody };
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

  const result = await executeDelivery(url, body, event, "dispatch");

  if (logId) {
    await updateDeliveryLog(logId, result.finalStatus, result.attempts, result.httpStatus, result.responseMs, result.errorMessage, result.responseBody);
  }
}

/**
 * Retry a specific delivery log by ID.
 *
 * Always re-resolves the URL from current settings so stale/broken URLs in
 * old log rows don't cause retries to fail with the same 404 they failed
 * with originally. Falls back to the stored URL only if settings return null.
 *
 * Re-serialises the stored request body exactly — does NOT create a new log row.
 */
export async function retryDelivery(logId: string): Promise<{ ok: boolean; httpStatus: number | null; error: string | null }> {
  const admin = createAdminClient();

  const { data: log } = await admin
    .from("webhook_delivery_logs")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("id, event, url, request_body, attempts" as any)
    .eq("id", logId)
    .single();

  if (!log) return { ok: false, httpStatus: null, error: "Log not found" };

  const row         = log as unknown as Record<string, unknown>;
  const storedUrl   = row.url as string;
  const event       = row.event as WebhookEvent;
  const prevAttempts = (row.attempts as number) ?? 0;

  // ── Re-resolve URL from current settings ────────────────────────────────
  // CRITICAL: do NOT re-use the stored URL. It may have been written before
  // a URL fix (e.g. website-lead vs website_lead). Always resolve fresh.
  const settings    = await getN8nSettings();
  const resolvedUrl = resolveUrl(event, settings);

  // Also check per-event env var and base env var as final fallbacks
  const envSpecific = process.env[`N8N_WEBHOOK_${event.toUpperCase()}`] ?? null;
  const envBase     = process.env.N8N_WEBHOOK_BASE_URL
    ? `${process.env.N8N_WEBHOOK_BASE_URL.replace(/\/$/, "")}/${event}`
    : null;

  const url = resolvedUrl ?? envSpecific ?? envBase ?? storedUrl;

  console.log(`[dispatcher:retry] ── RETRY logId=${logId} ──────────────────`);
  console.log(`[dispatcher:retry] event       : ${event}`);
  console.log(`[dispatcher:retry] stored URL  : ${storedUrl}`);
  console.log(`[dispatcher:retry] resolved URL: ${resolvedUrl}`);
  console.log(`[dispatcher:retry] final URL   : ${url}`);
  console.log(`[dispatcher:retry] prevAttempts: ${prevAttempts}`);

  if (storedUrl !== url) {
    console.warn(`[dispatcher:retry] URL changed from stored — updating log row`);
  }

  // ── Re-build request body ────────────────────────────────────────────────
  // row.request_body is already a parsed JS object (Supabase auto-parses JSONB).
  // JSON.stringify it back to a string — same structure as original dispatch.
  const rawBody = row.request_body;
  if (!rawBody || typeof rawBody !== "object") {
    console.error(`[dispatcher:retry] request_body missing or not an object:`, rawBody);
    return { ok: false, httpStatus: null, error: "stored request_body is missing" };
  }
  const body = JSON.stringify(rawBody);

  console.log(`[dispatcher:retry] body (first 300): ${body.slice(0, 300)}`);

  const result = await executeDelivery(url, body, event, "retry");

  // Update the ORIGINAL log row with the (possibly corrected) URL and result
  await updateDeliveryLog(
    logId,
    result.finalStatus,
    prevAttempts + result.attempts,
    result.httpStatus,
    result.responseMs,
    result.errorMessage,
    result.responseBody,
  );

  // If the URL was corrected, also update the stored url column so future
  // retries and the monitoring UI show the right endpoint
  if (storedUrl !== url) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await admin.from("webhook_delivery_logs").update({ url } as any).eq("id", logId);
    } catch { /* non-critical */ }
  }

  return { ok: result.finalStatus === "success", httpStatus: result.httpStatus, error: result.errorMessage };
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
