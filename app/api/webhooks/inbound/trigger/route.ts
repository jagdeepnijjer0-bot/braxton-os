import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyInboundSignature } from "@/lib/webhooks/dispatcher";
import { emit } from "@/lib/events/emit";
import type { TaskStatus, TaskPriority, TaskType, NotificationPriority, ContactStatus, DealStage } from "@/lib/supabase/types";

const VALID_CONTACT_STATUS: ContactStatus[] = ["new","contacted","qualified","proposal_sent","negotiating","closed_won","closed_lost","follow_up"];

const VALID_NOTIF_PRIORITY: NotificationPriority[] = ["low", "normal", "high", "urgent"];

const DEAL_STAGES: DealStage[] = [
  "lead_found","reviewing","offer_made","under_negotiation",
  "investor_interested","legals","refurb","sold_completed","dead",
];

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
 *   send_notification      – Alias for create_notification
 *   update_contact_status  – Set a contact's status (contact_id + status)
 *   create_contact         – Create a new CRM contact
 *   update_deal_stage      – Update deal stage (deal_id + stage required)
 *   create_deal            – Create a new deal
 *   mark_task_complete     – Mark a task as completed (task_id required)
 *   upsert_contact         – Upsert contact by email (email required)
 */

type Action =
  | "create_task"
  | "create_notification"
  | "send_notification"
  | "update_contact_status"
  | "create_contact"
  | "update_deal_stage"
  | "create_deal"
  | "mark_task_complete"
  | "upsert_contact";

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

      void emit("task.created", { task_id: data.id, title, priority, status }, { entityType: "task", entityId: data.id });

      return NextResponse.json({ success: true, task: data });
    }

    case "create_notification":
    case "send_notification": {
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

      void emit("lead.created", { contact_id: data.id, name, email: data.email }, { entityType: "contact", entityId: data.id });

      return NextResponse.json({ success: true, contact: data });
    }

    case "update_deal_stage": {
      const { deal_id, stage } = payload;
      if (typeof deal_id !== "string") {
        return NextResponse.json({ error: "deal_id is required" }, { status: 400 });
      }
      if (typeof stage !== "string" || !DEAL_STAGES.includes(stage as DealStage)) {
        return NextResponse.json({ error: `Invalid stage: ${stage}. Must be one of: ${DEAL_STAGES.join(", ")}` }, { status: 400 });
      }

      // Fetch current stage for event payload
      const { data: current } = await supabase
        .from("deals")
        .select("stage, deal_name")
        .eq("id", deal_id)
        .single();

      const { data, error } = await supabase
        .from("deals")
        .update({ stage: stage as DealStage })
        .eq("id", deal_id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      void emit(
        "deal.stage_changed",
        { deal_id: data.id, deal_name: data.deal_name, old_stage: current?.stage ?? null, new_stage: stage },
        { entityType: "deal", entityId: data.id },
      );

      return NextResponse.json({ success: true, deal: data });
    }

    case "create_deal": {
      const deal_name = typeof payload.deal_name === "string" ? payload.deal_name.trim() : "";
      if (!deal_name) return NextResponse.json({ error: "deal_name is required" }, { status: 400 });

      const stage: DealStage = DEAL_STAGES.includes(payload.stage as DealStage)
        ? (payload.stage as DealStage)
        : "lead_found";

      const { data, error } = await supabase
        .from("deals")
        .insert({
          deal_name,
          stage,
          address:           typeof payload.address          === "string" ? payload.address          : null,
          purchase_price:    typeof payload.purchase_price   === "number" ? payload.purchase_price   : null,
          linked_contact_id: typeof payload.linked_contact_id === "string" ? payload.linked_contact_id : null,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      void emit("deal.updated", { deal_id: data.id, deal_name, stage }, { entityType: "deal", entityId: data.id });

      return NextResponse.json({ success: true, deal: data });
    }

    case "mark_task_complete": {
      const task_id = typeof payload.task_id === "string" ? payload.task_id : null;
      if (!task_id) return NextResponse.json({ error: "task_id is required" }, { status: 400 });

      const { data, error } = await supabase
        .from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", task_id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Create in-app notification for task completion
      void supabase.from("notifications").insert({
        title:              `Task completed: ${data.title}`,
        body:               `Task marked complete via automation.`,
        type:               "system",
        priority:           "normal",
        link_url:           "/tasks",
        linked_entity_type: "task",
        linked_entity_id:   task_id,
        source_key:         `task_completed_${task_id}`,
      });

      return NextResponse.json({ success: true, task: data });
    }

    case "upsert_contact": {
      const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
      if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

      const name   = typeof payload.name    === "string" ? payload.name.trim()    : email;
      const phone  = typeof payload.phone   === "string" ? payload.phone.trim()   : null;
      const company = typeof payload.company === "string" ? payload.company.trim() : null;
      const source  = typeof payload.source  === "string" ? payload.source         : "n8n";
      const notes   = typeof payload.notes   === "string" ? payload.notes           : null;

      // Check if contact exists first to determine created vs updated
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      const { data, error } = await supabase
        .from("contacts")
        .upsert(
          { name, email, phone, company, source, notes, status: "new" },
          { onConflict: "email" },
        )
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const isNew = !existing;
      void emit(
        isNew ? "lead.created" : "lead.updated",
        { contact_id: data.id, name, email, source },
        { entityType: "contact", entityId: data.id },
      );

      return NextResponse.json({ success: true, contact: data, created: isNew });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
