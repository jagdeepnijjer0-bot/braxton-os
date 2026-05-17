import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyCronSecret, dispatchWebhook } from "@/lib/webhooks/dispatcher";

/**
 * POST /api/webhooks/cron/check-overdue
 *
 * Scheduled endpoint — call this from n8n on a daily schedule (or Vercel Cron).
 * Checks for overdue tasks and overdue CRM follow-ups, fires n8n webhooks
 * for each one and creates in-app notifications.
 *
 * Security: Authorization: Bearer <CRON_SECRET>
 *
 * n8n setup: HTTP Request node → POST this URL → Schedule Trigger (daily 09:00)
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!verifyCronSecret(auth)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const today    = new Date().toISOString().split("T")[0];

  const fired:  string[] = [];
  const errors: string[] = [];

  // ── 1. Overdue tasks ──────────────────────────────────────────────────────
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, assigned_to, linked_contact_id, linked_deal_id")
    .lt("due_date", today)
    .not("status", "in", '("completed","cancelled","overdue")');

  for (const task of tasks ?? []) {
    try {
      await dispatchWebhook("task_overdue", {
        task_id:     task.id,
        title:       task.title,
        due_date:    task.due_date,
        assigned_to: task.assigned_to,
        contact_id:  task.linked_contact_id,
        deal_id:     task.linked_deal_id,
      });

      await supabase.from("notifications").upsert(
        {
          title:              `Overdue task: ${task.title}`,
          body:               `Due ${task.due_date} — mark complete or reschedule.`,
          type:               "task_overdue",
          priority:           "high",
          link_url:           "/tasks",
          linked_entity_type: "task",
          linked_entity_id:   task.id,
          source_key:         `task_overdue_${task.id}`,
        },
        { onConflict: "source_key", ignoreDuplicates: true },
      );

      // Mark as overdue in DB
      await supabase.from("tasks").update({ status: "overdue" }).eq("id", task.id);

      fired.push(`task:${task.id}`);
    } catch {
      errors.push(`task:${task.id}`);
    }
  }

  // ── 2. Overdue CRM follow-ups ─────────────────────────────────────────────
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, email, phone, follow_up_date, assigned_to, lead_type")
    .lte("follow_up_date", today)
    .not("follow_up_date", "is", null)
    .not("status", "in", '("closed_won","closed_lost")');

  for (const contact of contacts ?? []) {
    try {
      await dispatchWebhook("overdue_followup", {
        contact_id:     contact.id,
        name:           contact.name,
        email:          contact.email,
        phone:          contact.phone,
        follow_up_date: contact.follow_up_date,
        assigned_to:    contact.assigned_to,
        lead_type:      contact.lead_type,
      });

      await supabase.from("notifications").upsert(
        {
          title:              `Overdue follow-up: ${contact.name}`,
          body:               `Follow-up was due ${contact.follow_up_date}. Action needed.`,
          type:               "follow_up_overdue",
          priority:           "high",
          link_url:           `/crm/${contact.id}`,
          linked_entity_type: "contact",
          linked_entity_id:   contact.id,
          source_key:         `overdue_followup_${contact.id}_${today}`,
        },
        { onConflict: "source_key", ignoreDuplicates: true },
      );

      fired.push(`contact:${contact.id}`);
    } catch {
      errors.push(`contact:${contact.id}`);
    }
  }

  return NextResponse.json({
    success:           true,
    date:              today,
    tasks_checked:     tasks?.length ?? 0,
    contacts_checked:  contacts?.length ?? 0,
    webhooks_fired:    fired.length,
    errors:            errors.length > 0 ? errors : undefined,
  });
}
