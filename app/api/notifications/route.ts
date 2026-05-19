import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Auto-generation is expensive (3 table scans + 3 upserts).
// Throttle it to at most once per 2 minutes per server instance so the
// read path stays fast when the notification bell polls every 5 minutes.
let _lastGeneratedAt = 0;
const GENERATE_EVERY_MS = 2 * 60 * 1000;

export async function GET(_req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  if (now - _lastGeneratedAt >= GENERATE_EVERY_MS) {
    _lastGeneratedAt = now; // set before awaits so concurrent requests don't double-generate
    await runAutoGeneration(supabase);
  }

  // Return the most recent 50 notifications (read + unread)
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

async function runAutoGeneration(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const today    = new Date().toISOString().split("T")[0];
  const in24h    = new Date(Date.now() + 24 * 3600_000).toISOString();
  const ago3days = new Date(Date.now() - 3 * 86_400_000).toISOString();

  // Run all three scans concurrently
  const [overdueTasks, followUps, meetings] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, due_date")
      .lt("due_date", today)
      .not("status", "in", '("completed","cancelled","overdue")')
      .limit(100),
    supabase
      .from("inbox_conversations")
      .select("id, contact_name, latest_message_at")
      .eq("status", "follow_up")
      .lt("latest_message_at", ago3days)
      .limit(50),
    supabase
      .from("calendar_events")
      .select("id, title, start_datetime")
      .eq("event_type", "meeting")
      .gte("start_datetime", new Date().toISOString())
      .lte("start_datetime", in24h)
      .limit(20),
  ]);

  await Promise.all([
    overdueTasks.data?.length
      ? Promise.all([
          supabase.from("notifications").upsert(
            overdueTasks.data.map(t => ({
              title:             `Overdue task: ${t.title}`,
              body:              `Due ${t.due_date} — mark complete or reschedule.`,
              type:              "task_overdue" as const,
              priority:          "high"  as const,
              link_url:          "/tasks",
              linked_entity_type:"task",
              linked_entity_id:  t.id,
              source_key:        `task_overdue_${t.id}`,
            })),
            { onConflict: "source_key", ignoreDuplicates: true },
          ),
          supabase.from("tasks").update({ status: "overdue" }).in("id", overdueTasks.data.map(t => t.id)),
        ])
      : null,

    followUps.data?.length
      ? supabase.from("notifications").upsert(
          followUps.data.map(c => ({
            title:             `Follow-up overdue: ${c.contact_name ?? "Unknown"}`,
            body:              "No reply in 3+ days. Send a follow-up message.",
            type:              "follow_up_overdue" as const,
            priority:          "normal" as const,
            link_url:          `/inbox/${c.id}`,
            linked_entity_type:"conversation",
            linked_entity_id:  c.id,
            source_key:        `follow_up_overdue_${c.id}`,
          })),
          { onConflict: "source_key", ignoreDuplicates: true },
        )
      : null,

    meetings.data?.length
      ? supabase.from("notifications").upsert(
          meetings.data.map(m => ({
            title:             `Upcoming meeting: ${m.title}`,
            body:              `Starts at ${new Date(m.start_datetime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
            type:              "meeting_upcoming" as const,
            priority:          "normal" as const,
            link_url:          "/calendar",
            linked_entity_type:"calendar_event",
            linked_entity_id:  m.id,
            source_key:        `meeting_upcoming_${m.id}_${new Date().toISOString().split("T")[0]}`,
          })),
          { onConflict: "source_key", ignoreDuplicates: true },
        )
      : null,
  ]);
}
