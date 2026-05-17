import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Auto-generates notifications from DB state then returns all unread
export async function GET(_req: NextRequest) {
  const supabase = await createServerClient();
  const today = new Date().toISOString().split("T")[0];

  // ── Auto-generate: overdue tasks ──────────────────────────────
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, title, due_date")
    .lt("due_date", today)
    .not("status", "in", '("completed","cancelled","overdue")');

  if (overdueTasks?.length) {
    const inserts = overdueTasks.map(t => ({
      title:             `Overdue task: ${t.title}`,
      body:              `Due ${t.due_date} — mark complete or reschedule.`,
      type:              "task_overdue" as const,
      priority:          "high"  as const,
      link_url:          `/tasks`,
      linked_entity_type:"task",
      linked_entity_id:  t.id,
      source_key:        `task_overdue_${t.id}`,
    }));
    await supabase.from("notifications").upsert(inserts, { onConflict: "source_key", ignoreDuplicates: true });
    // Mark those tasks as overdue
    const ids = overdueTasks.map(t => t.id);
    await supabase.from("tasks").update({ status: "overdue" }).in("id", ids);
  }

  // ── Auto-generate: overdue follow-up conversations ────────────
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: followUps } = await supabase
    .from("inbox_conversations")
    .select("id, contact_name, latest_message_at")
    .eq("status", "follow_up")
    .lt("latest_message_at", threeDaysAgo);

  if (followUps?.length) {
    const inserts = followUps.map(c => ({
      title:             `Follow-up overdue: ${c.contact_name ?? "Unknown"}`,
      body:              "No reply in 3+ days. Send a follow-up message.",
      type:              "follow_up_overdue" as const,
      priority:          "normal" as const,
      link_url:          `/inbox/${c.id}`,
      linked_entity_type:"conversation",
      linked_entity_id:  c.id,
      source_key:        `follow_up_overdue_${c.id}`,
    }));
    await supabase.from("notifications").upsert(inserts, { onConflict: "source_key", ignoreDuplicates: true });
  }

  // ── Auto-generate: upcoming meetings (next 24h) ───────────────
  const in24h = new Date(Date.now() + 24 * 3600000).toISOString();
  const { data: meetings } = await supabase
    .from("calendar_events")
    .select("id, title, start_datetime")
    .eq("event_type", "meeting")
    .gte("start_datetime", new Date().toISOString())
    .lte("start_datetime", in24h);

  if (meetings?.length) {
    const inserts = meetings.map(m => ({
      title:             `Upcoming meeting: ${m.title}`,
      body:              `Starts at ${new Date(m.start_datetime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
      type:              "meeting_upcoming" as const,
      priority:          "normal" as const,
      link_url:          `/calendar`,
      linked_entity_type:"calendar_event",
      linked_entity_id:  m.id,
      source_key:        `meeting_upcoming_${m.id}_${today}`,
    }));
    await supabase.from("notifications").upsert(inserts, { onConflict: "source_key", ignoreDuplicates: true });
  }

  // ── Return all unread notifications ───────────────────────────
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
