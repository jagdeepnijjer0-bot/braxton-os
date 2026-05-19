import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyInboundSignature } from "@/lib/webhooks/dispatcher";
import type { NotificationPriority, ContactStatus } from "@/lib/supabase/types";

/**
 * POST /api/webhooks/inbound/n8n
 *
 * n8n workflow callback endpoint. n8n calls this to send workflow results
 * back to Braxton OS after processing a BraxtonEventName trigger.
 *
 * Unlike /trigger (generic actions), this is designed for n8n workflow callbacks
 * and supports batched actions + automation_logs recording.
 *
 * Security: X-Braxton-Signature HMAC (same as /trigger)
 */

type N8nActionType = "create_task" | "create_notification" | "update_contact" | "log";

interface N8nAction {
  type: N8nActionType;
  payload: Record<string, unknown>;
}

interface N8nCallbackBody {
  workflow_id: string;
  workflow_name: string;
  execution_id: string;
  status: "success" | "error";
  event: string;
  entity_type?: string;
  entity_id?: string;
  actions?: N8nAction[];
  metadata?: Record<string, unknown>;
}

const VALID_NOTIF_PRIORITY: NotificationPriority[] = ["low", "normal", "high", "urgent"];

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-braxton-signature") ?? "";

  if (process.env.N8N_WEBHOOK_SECRET && !verifyInboundSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: N8nCallbackBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workflow_id, workflow_name, execution_id, status, event, entity_type, entity_id, actions = [], metadata = {} } = body;

  if (!workflow_id || !execution_id || !status || !event) {
    return NextResponse.json(
      { error: "workflow_id, execution_id, status, and event are required" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Process each action
  const actionsProcessed: string[] = [];
  const errors: string[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "create_task": {
          const title = typeof action.payload.title === "string" ? action.payload.title.trim() : "";
          if (!title) { errors.push(`create_task: title required`); break; }

          const { error: taskErr } = await admin.from("tasks").insert({
            title,
            description:       typeof action.payload.description === "string" ? action.payload.description : null,
            status:            "todo",
            priority:          typeof action.payload.priority === "string" ? (action.payload.priority as "low" | "medium" | "high" | "urgent") : "medium",
            task_type:         typeof action.payload.task_type === "string" ? (action.payload.task_type as "call" | "follow_up" | "meeting" | "refurb" | "finance" | "outreach" | "admin") : "admin",
            due_date:          typeof action.payload.due_date === "string" ? action.payload.due_date : null,
            linked_contact_id: typeof action.payload.contact_id === "string" ? action.payload.contact_id : null,
            linked_deal_id:    typeof action.payload.deal_id === "string" ? action.payload.deal_id : null,
          });

          if (taskErr) { errors.push(`create_task: ${taskErr.message}`); break; }
          actionsProcessed.push("create_task");
          break;
        }

        case "create_notification": {
          const notifTitle = typeof action.payload.title === "string" ? action.payload.title : `n8n: ${workflow_name}`;
          const priority: NotificationPriority = VALID_NOTIF_PRIORITY.includes(action.payload.priority as NotificationPriority)
            ? (action.payload.priority as NotificationPriority)
            : "normal";

          const { error: notifErr } = await admin.from("notifications").insert({
            title:    notifTitle,
            body:     typeof action.payload.body === "string" ? action.payload.body : "",
            type:     "system",
            priority,
            link_url: typeof action.payload.link_url === "string" ? action.payload.link_url : null,
            source_key: `n8n_${workflow_id}_${execution_id}_${Date.now()}`,
          });

          if (notifErr) { errors.push(`create_notification: ${notifErr.message}`); break; }
          actionsProcessed.push("create_notification");
          break;
        }

        case "update_contact": {
          const contactId = typeof action.payload.contact_id === "string" ? action.payload.contact_id : null;
          if (!contactId) { errors.push("update_contact: contact_id required"); break; }

          // Build a typed update object
          const updateFields: {
            status?: ContactStatus;
            notes?: string | null;
            follow_up_date?: string | null;
          } = {};
          if (typeof action.payload.status === "string") updateFields.status = action.payload.status as ContactStatus;
          if (typeof action.payload.notes  === "string") updateFields.notes  = action.payload.notes;
          if (typeof action.payload.follow_up_date === "string") updateFields.follow_up_date = action.payload.follow_up_date;

          if (Object.keys(updateFields).length === 0) { errors.push("update_contact: no fields to update"); break; }

          const { error: contactErr } = await admin.from("contacts").update(updateFields).eq("id", contactId);
          if (contactErr) { errors.push(`update_contact: ${contactErr.message}`); break; }
          actionsProcessed.push("update_contact");
          break;
        }

        case "log":
          // No-op — log actions are just for tracing, captured in automation_logs below
          actionsProcessed.push("log");
          break;

        default:
          errors.push(`Unknown action type: ${(action as { type: string }).type}`);
      }
    } catch (err) {
      errors.push(`${action.type}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Record entire workflow execution in automation_logs
  try {
    await admin.from("automation_logs").insert({
      event_name:     event,
      entity_type:    entity_type ?? null,
      entity_id:      entity_id ?? null,
      source:         "n8n",
      triggered_by:   `workflow:${workflow_name}`,
      payload:        { workflow_id, execution_id, status, actions_count: actions.length, metadata } as Record<string, unknown>,
      webhooks_fired: 0,
      status:         errors.length > 0 ? (actionsProcessed.length > 0 ? "partial" : "failed") : "ok",
      error_message:  errors.length > 0 ? errors.join("; ") : null,
    });
  } catch {
    // Never block main flow
  }

  return NextResponse.json({
    ok:               true,
    workflow_id,
    actions_processed: actionsProcessed.length,
    errors:            errors.length > 0 ? errors : undefined,
  });
}
