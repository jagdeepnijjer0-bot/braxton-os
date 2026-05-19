import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { dispatchWebhook, WEBHOOK_EVENTS } from "@/lib/webhooks/dispatcher";
import type { WebhookEvent } from "@/lib/webhooks/dispatcher";

// POST /api/integrations/n8n/test
// Fires a test payload for a given event. Admin/manager only.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "manager"].includes(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { event: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!WEBHOOK_EVENTS.includes(body.event as WebhookEvent)) {
    return NextResponse.json({ error: `Unknown event: ${body.event}` }, { status: 400 });
  }

  const testPayload: Record<string, unknown> = {
    test:       true,
    event:      body.event,
    timestamp:  new Date().toISOString(),
    fired_by:   user.id,
    sample_data: TEST_PAYLOADS[body.event as WebhookEvent] ?? { message: "test event" },
  };

  try {
    await dispatchWebhook(body.event as WebhookEvent, testPayload);
    return NextResponse.json({ ok: true, event: body.event });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

const TEST_PAYLOADS: Partial<Record<WebhookEvent, Record<string, unknown>>> = {
  new_contact:       { contact_id: "test-id", name: "Test Lead", email: "test@example.com", phone: "+447700900000", source: "website", lead_type: "website_app_prospect" },
  hot_lead:          { contact_id: "test-id", name: "Test Lead", score: 85, heat: "hot", summary: "High-intent buyer — viewing booked" },
  task_created:      { task_id: "test-id", title: "Call Test Lead", priority: "high", due_date: new Date().toISOString().split("T")[0] },
  task_overdue:      { task_id: "test-id", title: "Overdue Call", due_date: "2025-01-01" },
  deal_stage_changed:{ deal_id: "test-id", deal_name: "123 Test Street", old_stage: "reviewing", new_stage: "offer_made" },
  deal_updated:      { deal_id: "test-id", deal_name: "123 Test Street", stage: "offer_made", purchase_price: 150000 },
  lead_updated:      { contact_id: "test-id", name: "Test Lead", changes: { status: ["new", "contacted"] } },
  file_uploaded:     { file_id: "test-id", filename: "test-document.pdf", entity_type: "contact", entity_id: "test-id", file_size: 102400 },
  message_received:  { conversation_id: "test-id", platform: "instagram", sender_name: "Test User", body: "Hi, I saw your property listing" },
  website_lead:      { contact_id: "test-id", name: "Test Lead", email: "test@example.com", source: "website" },
  outreach_reply:    { lead_id: "test-id", contact_name: "Test Lead", platform: "instagram", reply_status: "positive" },
  overdue_followup:  { contact_id: "test-id", name: "Test Lead", follow_up_date: "2025-01-01" },
};
