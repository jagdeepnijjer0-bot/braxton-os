import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkflowSource =
  | "meta_webhook"
  | "form_submit"
  | "crm_create"
  | "crm_update"
  | "inbox_message"
  | "ai_engine"
  | "manual";

export type WorkflowEntityType =
  | "contact"
  | "conversation"
  | "form_submission"
  | "task"
  | "deal";

export interface WorkflowEventInput {
  event_type:  string;
  source:      WorkflowSource;
  entity_type: WorkflowEntityType;
  entity_id:   string;
  payload?:    Record<string, unknown>;
}

// ── Emit ──────────────────────────────────────────────────────────────────────

export async function emitWorkflowEvent(event: WorkflowEventInput): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("workflow_events").insert({
    event_type:  event.event_type,
    source:      event.source,
    entity_type: event.entity_type,
    entity_id:   event.entity_id,
    payload:     event.payload ?? {},
  });
}

// ── Query ─────────────────────────────────────────────────────────────────────

export async function getWorkflowEvents(
  entityType: WorkflowEntityType,
  entityId:   string,
  limit = 20,
) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("workflow_events")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ── Plug-in contract for future integrations ─────────────────────────────────
// Gmail, WhatsApp, n8n etc. implement this interface and call emitWorkflowEvent

export interface WorkflowIntegration {
  name:    string;
  source:  WorkflowSource;
  /** Called when an inbound event arrives from this integration */
  handleInbound(payload: Record<string, unknown>): Promise<WorkflowEventInput[]>;
  /** Called to send an outbound message / trigger via this integration */
  handleOutbound?(event: WorkflowEventInput): Promise<void>;
}
