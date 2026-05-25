import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";
import type { WebhookEvent } from "@/lib/webhooks/dispatcher";

// ── Event name → webhook event mapping ───────────────────────────────────────

export type BraxtonEventName =
  | "lead.created"
  | "lead.updated"
  | "ai.hot_lead"
  | "task.created"
  | "task.overdue"
  | "message.received"
  | "deal.updated"
  | "deal.stage_changed"
  | "file.uploaded"
  | "website_lead"
  | "outreach.reply"
  | "followup.overdue"
  | "demo.access_created"
  | "demo.high_intent"
  | "demo.package_reserved"
  | "demo.book_call_clicked";

const EVENT_MAP: Record<BraxtonEventName, WebhookEvent> = {
  "lead.created":           "new_contact",
  "lead.updated":           "lead_updated",
  "ai.hot_lead":            "hot_lead",
  "task.created":           "task_created",
  "task.overdue":           "task_overdue",
  "message.received":       "message_received",
  "deal.updated":           "deal_updated",
  "deal.stage_changed":     "deal_stage_changed",
  "file.uploaded":          "file_uploaded",
  "website_lead":           "website_lead",
  "outreach.reply":         "outreach_reply",
  "followup.overdue":       "overdue_followup",
  "demo.access_created":    "demo_access_created",
  "demo.high_intent":       "demo_high_intent",
  "demo.package_reserved":  "demo_package_reserved",
  "demo.book_call_clicked": "demo_book_call_clicked",
};

// ── Typed payload interfaces ──────────────────────────────────────────────────

export interface LeadCreatedPayload    { contact_id?: string; name?: string; email?: string; phone?: string; source?: string; }
export interface LeadUpdatedPayload    { contact_id?: string; name?: string; email?: string; changes?: Record<string, unknown>; }
export interface AiHotLeadPayload      { contact_id?: string; score?: number; heat?: "hot" | "warm" | "cold"; summary?: string; }
export interface TaskCreatedPayload    { task_id?: string; title?: string; due_date?: string; assigned_to?: string; priority?: string; }
export interface TaskOverduePayload    { task_id?: string; title?: string; due_date?: string; assigned_to?: string; }
export interface MessageReceivedPayload { conversation_id?: string; platform?: string; sender_name?: string; body?: string; }
export interface DealUpdatedPayload    { deal_id?: string; deal_name?: string; stage?: string; changes?: Record<string, unknown>; }
export interface DealStageChangedPayload { deal_id?: string; deal_name?: string; old_stage?: string; new_stage?: string; }
export interface FileUploadedPayload   { file_id?: string; filename?: string; entity_type?: string; entity_id?: string; file_size?: number; mime_type?: string; }
export interface WebsiteLeadPayload    { form_type?: string; contact_id?: string; name?: string; email?: string; }
export interface OutreachReplyPayload  { lead_id?: string; contact_name?: string; platform?: string; reply_status?: string; }
export interface FollowupOverduePayload { contact_id?: string; name?: string; follow_up_date?: string; }

// ── Emit function ─────────────────────────────────────────────────────────────

export async function emit(
  event: BraxtonEventName,
  payload: Record<string, unknown>,
  context?: {
    entityType?: string;
    entityId?: string;
    triggeredBy?: string;
  },
): Promise<void> {
  const webhookEvent = EVENT_MAP[event];
  let webhooksFired = 0;
  let logStatus: "ok" | "partial" | "failed" = "ok";
  let errorMessage: string | undefined;

  // Dispatch webhook
  try {
    await dispatchWebhook(webhookEvent, payload);
    webhooksFired = 1;
  } catch (err) {
    webhooksFired = 0;
    logStatus = "partial";
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Log to automation_logs (fire-and-forget, never throws)
  try {
    const admin = createAdminClient();
    await admin.from("automation_logs").insert({
      event_name:     event,
      entity_type:    context?.entityType ?? null,
      entity_id:      context?.entityId ?? null,
      source:         "braxton-os",
      triggered_by:   context?.triggeredBy ?? null,
      payload,
      webhooks_fired: webhooksFired,
      status:         logStatus,
      error_message:  errorMessage ?? null,
    });
  } catch {
    // Never let logging break the caller
  }
}
