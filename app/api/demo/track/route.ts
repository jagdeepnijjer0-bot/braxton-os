import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateDemoSession,
  updateEngagementScore,
  scoreLabel,
  SCORE_HIGH_THRESHOLD,
  DEMO_COOKIE,
} from "@/lib/demo/session";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

const SCORE_BY_EVENT: Record<string, number> = {
  page_view:          2,
  crm_viewed:         3,
  inbox_viewed:       3,
  tasks_viewed:       3,
  automations_viewed: 5,
  reserve_viewed:     8,
  book_call_clicked:  15,
  package_selected:   10,
};

/**
 * POST /api/demo/track
 *
 * Records a demo engagement event and updates the session's engagement score.
 * Fires demo_high_intent webhook when the threshold is crossed for the first time.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(DEMO_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  const session = await validateDemoSession(token);
  if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event_type = typeof body.event_type === "string" ? body.event_type : "page_view";
  const metadata = typeof body.metadata === "object" && body.metadata ? body.metadata as Record<string, unknown> : {};

  const admin = createAdminClient();

  // Log the event
  try {
    await admin
      .from("demo_events")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ session_id: session.id, event_type, metadata } as any);
  } catch { /* non-critical */ }

  // Update engagement score
  const delta = SCORE_BY_EVENT[event_type] ?? 1;
  const prevScore = session.engagement_score;
  await updateEngagementScore(session.id, delta);
  const newScore = prevScore + delta;

  // Fire high-intent webhook when threshold first crossed
  if (prevScore < SCORE_HIGH_THRESHOLD && newScore >= SCORE_HIGH_THRESHOLD) {
    void Promise.race([
      dispatchWebhook("demo_high_intent", {
        session_id:   session.id,
        contact_id:   session.contact_id,
        name:         session.name,
        email:        session.email,
        business_name: session.business_name,
        score:        newScore,
      }),
      new Promise<void>(r => setTimeout(r, 4000)),
    ]).catch(() => { /* non-critical */ });

    // Create a high-intent follow-up task
    void (async () => {
      try {
        await admin.from("tasks").insert({
          title: `High-intent demo user: ${session.name}`,
          description: `${session.email} reached engagement score ${newScore}. Book a strategy call.`,
          task_type: "follow_up",
          status: "todo",
          priority: "urgent",
          linked_contact_id: session.contact_id ?? undefined,
        } as never);
      } catch { /* non-critical */ }

      try {
        await admin.from("notifications").insert({
          title: `High-intent demo: ${session.name}`,
          body: `Score ${newScore} — ${session.email}. Time to reach out.`,
          type: "system",
          priority: "urgent",
          link_url: "/admin/demo-leads",
          linked_entity_type: "contact",
          linked_entity_id: session.contact_id,
          source_key: `demo_high_intent_${session.id}`,
        } as never);
      } catch { /* non-critical */ }
    })();
  }

  // Fire book_call_clicked webhook
  if (event_type === "book_call_clicked") {
    void Promise.race([
      dispatchWebhook("demo_book_call_clicked", {
        session_id: session.id,
        contact_id: session.contact_id,
        name: session.name,
        email: session.email,
      }),
      new Promise<void>(r => setTimeout(r, 4000)),
    ]).catch(() => { /* non-critical */ });
  }

  return NextResponse.json({
    ok: true,
    score: newScore,
    intent: scoreLabel(newScore),
  });
}
