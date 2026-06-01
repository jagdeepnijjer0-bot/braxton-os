import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DemoLeadPayload {
  sessionId:    string;
  name:         string;
  email:        string;
  businessName: string | null;
  industry:     string | null;
  bottleneck:   string | null;
  timestamp:    string;
}

// ─── Idempotency + logging ─────────────────────────────────────────────────────

async function alreadySent(sessionId: string, channel: "email" | "telegram"): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("demo_events")
      .select("id")
      .eq("session_id", sessionId)
      .eq("event_type", `notification_${channel}_sent`)
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false; // fail open — attempt the send
  }
}

async function logEvent(
  sessionId: string,
  channel:   "email" | "telegram",
  status:    "sent" | "failed",
  error?:    string,
): Promise<void> {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from("demo_events") as any).insert({
      session_id: sessionId,
      event_type: `notification_${channel}_${status}`,
      metadata:   error ? { error } : {},
    });
  } catch {
    // Never block on logging failures
  }
}

// ─── Email ─────────────────────────────────────────────────────────────────────

export async function sendDemoLeadEmail(payload: DemoLeadPayload): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const to        = process.env.NOTIFY_EMAIL_TO;

  if (!gmailUser || !gmailPass || !to) {
    console.warn("[notify:email] Skipped — GMAIL_USER, GMAIL_APP_PASSWORD, or NOTIFY_EMAIL_TO not set");
    return;
  }

  if (await alreadySent(payload.sessionId, "email")) {
    console.log(`[notify:email] Already sent for session ${payload.sessionId} — skipping`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const subject = `New demo lead: ${payload.name}${payload.businessName ? ` (${payload.businessName})` : ""}`;

    const html = `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px 0">
  <h2 style="color:#4f46e5;margin:0 0 20px">🆕 New Braxton OS Demo Lead</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr>
      <td style="padding:9px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb;width:120px">Name</td>
      <td style="padding:9px 12px;border:1px solid #e5e7eb;color:#111827">${payload.name}</td>
    </tr>
    <tr>
      <td style="padding:9px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb">Email</td>
      <td style="padding:9px 12px;border:1px solid #e5e7eb"><a href="mailto:${payload.email}" style="color:#4f46e5">${payload.email}</a></td>
    </tr>
    <tr>
      <td style="padding:9px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb">Business</td>
      <td style="padding:9px 12px;border:1px solid #e5e7eb;color:#111827">${payload.businessName ?? "—"}</td>
    </tr>
    <tr>
      <td style="padding:9px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb">Industry</td>
      <td style="padding:9px 12px;border:1px solid #e5e7eb;color:#111827">${payload.industry ?? "—"}</td>
    </tr>
    <tr>
      <td style="padding:9px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb">Challenge</td>
      <td style="padding:9px 12px;border:1px solid #e5e7eb;color:#111827">${payload.bottleneck ?? "—"}</td>
    </tr>
    <tr>
      <td style="padding:9px 12px;font-weight:600;color:#374151;background:#f9fafb;border:1px solid #e5e7eb">Submitted</td>
      <td style="padding:9px 12px;border:1px solid #e5e7eb;color:#6b7280;font-size:13px">${payload.timestamp}</td>
    </tr>
  </table>
</div>`;

    await transporter.sendMail({
      from:    `"Braxton OS" <${gmailUser}>`,
      to,
      subject,
      html,
    });

    await logEvent(payload.sessionId, "email", "sent");
    console.log(`[notify:email] ✓ Sent to ${to} — session ${payload.sessionId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[notify:email] ✗ Failed — session ${payload.sessionId}:`, message);
    await logEvent(payload.sessionId, "email", "failed", message);
  }
}

// ─── Telegram ──────────────────────────────────────────────────────────────────

export async function sendDemoLeadTelegram(payload: DemoLeadPayload): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("[notify:telegram] Skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set");
    return;
  }

  if (await alreadySent(payload.sessionId, "telegram")) {
    console.log(`[notify:telegram] Already sent for session ${payload.sessionId} — skipping`);
    return;
  }

  const text = [
    `🆕 *New Braxton OS Demo Lead*`,
    ``,
    `👤 *Name:* ${payload.name}`,
    `📧 *Email:* ${payload.email}`,
    `🏢 *Business:* ${payload.businessName ?? "—"}`,
    `🏭 *Industry:* ${payload.industry ?? "—"}`,
    `🎯 *Challenge:* ${payload.bottleneck ?? "—"}`,
    `🕐 *Submitted:* ${payload.timestamp}`,
  ].join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
      },
    );

    const json = await res.json() as { ok: boolean; description?: string };

    if (!json.ok) {
      throw new Error(json.description ?? `Telegram API returned ok=false (HTTP ${res.status})`);
    }

    await logEvent(payload.sessionId, "telegram", "sent");
    console.log(`[notify:telegram] ✓ Sent to chat ${chatId} — session ${payload.sessionId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[notify:telegram] ✗ Failed — session ${payload.sessionId}:`, message);
    await logEvent(payload.sessionId, "telegram", "failed", message);
  }
}
