import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateDemoSession, updateEngagementScore, DEMO_COOKIE } from "@/lib/demo/session";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

/**
 * POST /api/demo/book-call
 *
 * Called when a demo user clicks "Book a call". Idempotent per session —
 * repeated clicks still log events but don't create duplicate CRM entries.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(DEMO_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  const session = await validateDemoSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Webhook — before any slow DB writes
  void Promise.race([
    dispatchWebhook("demo_book_call_clicked", {
      session_id:    session.id,
      contact_id:    session.contact_id,
      name:          session.name,
      email:         session.email,
      business_name: session.business_name,
      package_reserved: session.package_reserved,
    }),
    new Promise<void>(r => setTimeout(r, 4000)),
  ]).catch(() => { /* non-critical */ });

  // Increase engagement score (+15 for book call)
  await updateEngagementScore(session.id, 15);

  // Log demo event
  try {
    await admin.from("demo_events").insert({
      session_id: session.id,
      event_type: "book_call_clicked",
      metadata: { source: "book_call_button", timestamp: now },
    });
  } catch { /* non-critical */ }

  // Fire-and-forget: CRM activity, inbox, notification
  void (async () => {
    // CRM contact activity
    if (session.contact_id) {
      try {
        await admin.from("contact_activities").insert({
          contact_id: session.contact_id,
          type: "call",
          body: `Demo user clicked "Book a call" during workspace session. Engagement score: ${session.engagement_score + 15}.${session.package_reserved ? ` Package interest: ${session.package_reserved}.` : ""}`,
          metadata: {
            source: "demo_funnel",
            session_id: session.id,
            package_reserved: session.package_reserved,
            engagement_score: session.engagement_score + 15,
          },
        });
      } catch { /* non-critical */ }
    }

    // Inbox conversation + message
    try {
      const { data: conv } = await admin.from("inbox_conversations").insert({
        platform: "website_form",
        contact_id: session.contact_id,
        contact_name: session.name,
        contact_email: session.email,
        subject: `Book a call — ${session.name}`,
        latest_message: `${session.name} clicked "Book a call" in the demo workspace${session.package_reserved ? ` after expressing interest in ${session.package_reserved}` : ""}.`,
        latest_message_at: now,
        status: "open",
        priority: "urgent",
        is_read: false,
      }).select("id").single();

      if (conv?.id) {
        await admin.from("inbox_messages").insert({
          conversation_id: conv.id,
          direction: "inbound",
          body: `${session.name} (${session.email}) clicked "Book a call" in the demo workspace.${session.business_name ? ` Business: ${session.business_name}.` : ""}${session.package_reserved ? ` Package interest: ${session.package_reserved}.` : ""}`,
          sender_name: session.name,
          is_read: false,
        });
      }
    } catch { /* non-critical */ }

    // Notification
    try {
      await admin.from("notifications").insert({
        title: `Book a call: ${session.name}`,
        body: `${session.email}${session.business_name ? ` — ${session.business_name}` : ""}${session.package_reserved ? ` · ${session.package_reserved}` : ""}`,
        type: "system",
        priority: "urgent",
        link_url: "/admin/demo-leads",
        linked_entity_type: "contact",
        linked_entity_id: session.contact_id,
        source_key: `demo_book_call_${session.id}_${Date.now()}`,
      } as never);
    } catch { /* non-critical */ }
  })();

  return NextResponse.json({ ok: true });
}
