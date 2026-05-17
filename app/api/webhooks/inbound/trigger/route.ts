import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyInboundSignature } from "@/lib/webhooks/dispatcher";
import type { TaskStatus, TaskPriority, TaskType, NotificationPriority, ContactStatus } from "@/lib/supabase/types";

const VALID_CONTACT_STATUS: ContactStatus[] = ["new","contacted","qualified","proposal_sent","negotiating","closed_won","closed_lost","follow_up"];

const VALID_NOTIF_PRIORITY: NotificationPriority[] = ["low", "normal", "high", "urgent"];

/**
 * POST /api/webhooks/inbound/trigger
 *
 * Generic action endpoint that n8n (or any automation) can call to
 * make Braxton OS do something: create a task, update a contact,
 * send a notification, etc.
 *
 * Body: { "action": "<action_name>", "payload": { ... } }
 *
 * Supported actions:
 *   create_task            – Create a task (title required)
 *   create_notification    – Push an in-app notification
 *   update_contact_status  – Set a contact's status (contact_id + status)
 *   create_contact         – Create a new CRM contact
 */

type Action =
  | "create_task"
  | "create_notification"
  | "update_contact_status"
  | "create_contact";

const VALID_TASK_STATUS: TaskStatus[]     = ["todo", "in_progress", "completed", "overdue", "cancelled"];
const VALID_TASK_PRIORITY: TaskPriority[] = ["low", "medium", "high", "urgent"];
const VALID_TASK_TYPE: TaskType[]         = ["call", "follow_up", "meeting", "refurb", "finance", "outreach", "admin"];

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("x-braxton-signature") ?? "";

  if (process.env.N8N_WEBHOOK_SECRET && !verifyInboundSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let parsed: { action: Action; payload: Record<string, unknown> };
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, payload } = parsed;
  if (!action || !payload) {
    return NextResponse.json({ error: "action and payload are required" }, { status: 400 });
  }

  const supabase = await createServerClient();

  switch (action) {

    case "create_task": {
      const title = typeof payload.title === "string" ? payload.title.trim() : "";
      if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

      const status:   TaskStatus   = VALID_TASK_STATUS.includes(payload.status as TaskStatus)     ? payload.status as TaskStatus   : "todo";
      const priority: TaskPriority = VALID_TASK_PRIORITY.includes(payload.priority as TaskPriority) ? payload.priority as TaskPriority : "medium";
      const taskType: TaskType     = VALID_TASK_TYPE.includes(payload.task_type as TaskType)         ? payload.task_type as TaskType    : "admin";

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title,
          description:       typeof payload.description === "string" ? payload.description : null,
          status,
          priority,
          task_type:         taskType,
          due_date:          typeof payload.due_date === "string" ? payload.due_date : null,
          linked_contact_id: typeof payload.contact_id === "string" ? payload.contact_id : null,
          linked_deal_id:    typeof payload.deal_id === "string" ? payload.deal_id : null,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, task: data });
    }

    case "create_notification": {
      const title = typeof payload.title === "string" ? payload.title : "Notification from n8n";
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          title,
          body:     typeof payload.body === "string" ? payload.body : "",
          type:     "system",
          priority: (VALID_NOTIF_PRIORITY.includes(payload.priority as NotificationPriority) ? payload.priority as NotificationPriority : "normal"),
          link_url: typeof payload.link_url === "string" ? payload.link_url : null,
          source_key: `n8n_trigger_${Date.now()}`,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, notification: data });
    }

    case "update_contact_status": {
      const { contact_id, status } = payload;
      if (typeof contact_id !== "string" || typeof status !== "string") {
        return NextResponse.json({ error: "contact_id and status are required" }, { status: 400 });
      }
      if (!VALID_CONTACT_STATUS.includes(status as ContactStatus)) {
        return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("contacts")
        .update({ status: status as ContactStatus })
        .eq("id", contact_id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, contact: data });
    }

    case "create_contact": {
      const name = typeof payload.name === "string" ? payload.name.trim() : "";
      if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          name,
          email:    typeof payload.email   === "string" ? payload.email.trim()   : null,
          phone:    typeof payload.phone   === "string" ? payload.phone.trim()   : null,
          company:  typeof payload.company === "string" ? payload.company.trim() : null,
          status:   "new",
          source:   typeof payload.source  === "string" ? payload.source : "n8n",
          notes:    typeof payload.notes   === "string" ? payload.notes  : null,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, contact: data });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
