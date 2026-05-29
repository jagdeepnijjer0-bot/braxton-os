import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateDemoSession, DEMO_COOKIE } from "@/lib/demo/session";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

const VALID_PACKAGES = ["starter", "growth", "automation", "custom"];

const PACKAGE_NAMES: Record<string, string> = {
  starter:    "Starter OS",
  growth:     "Growth OS",
  automation: "Automation OS",
  custom:     "Custom AI OS",
};

/**
 * POST /api/demo/reserve
 *
 * Records a package reservation from a demo user.
 * Creates a CRM deal, notification, inbox conversation, task, and fires
 * the demo_package_reserved webhook. No Stripe — intent capture only.
 */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(DEMO_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "No demo session" }, { status: 401 });

  const session = await validateDemoSession(token);
  if (!session) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const package_id = typeof body.package_id === "string" ? body.package_id : "";
  const timeframe  = typeof body.timeframe === "string"  ? body.timeframe.trim()  : null;
  const notes      = typeof body.notes === "string"      ? body.notes.trim()      : null;

  if (!VALID_PACKAGES.includes(package_id)) {
    return NextResponse.json({ error: "Invalid package_id" }, { status: 400 });
  }

  const packageName = PACKAGE_NAMES[package_id];
  const admin = createAdminClient();

  // Mark session as reserved
  await admin
    .from("demo_sessions")
    .update({ package_reserved: package_id })
    .eq("id", session.id);

  // Log demo event
  try {
    await admin
      .from("demo_events")
      .insert({ session_id: session.id, event_type: "package_reserved", metadata: { package_id, timeframe: timeframe ?? null, notes: notes ?? null } });
  } catch { /* non-critical */ }

  // Webhook — before response
  try {
    await Promise.race([
      dispatchWebhook("demo_package_reserved", {
        session_id:   session.id,
        contact_id:   session.contact_id,
        name:         session.name,
        email:        session.email,
        business_name: session.business_name,
        package_id,
        package_name: packageName,
        timeframe,
        notes,
      }),
      new Promise<void>(r => setTimeout(r, 4000)),
    ]);
  } catch { /* non-critical */ }

  // Fire-and-forget CRM / notifications
  void (async () => {
    try {
      // Create a deal in the pipeline
      await admin.from("deals").insert({
        name:          `${packageName} — ${session.name}`,
        contact_id:    session.contact_id ?? undefined,
        stage:         "proposal",
        value:         0, // no Stripe — value TBD on call
        currency:      "GBP",
        probability:   60,
        notes:         `Demo reservation. Timeframe: ${timeframe ?? "not specified"}. Notes: ${notes ?? "none"}`,
        source:        "demo_funnel",
      } as never);
    } catch { /* non-critical */ }

    try {
      await admin.from("notifications").insert({
        title: `Package reserved: ${packageName}`,
        body: `${session.name} (${session.email}) reserved ${packageName}${timeframe ? ` — ${timeframe}` : ""}.`,
        type: "system",
        priority: "urgent",
        link_url: "/admin/demo-leads",
        linked_entity_type: "contact",
        linked_entity_id: session.contact_id,
        source_key: `demo_reserve_${session.id}`,
      } as never);
    } catch { /* non-critical */ }

    try {
      const { data: conv } = await admin
        .from("inbox_conversations")
        .insert({
          platform: "website_form",
          contact_id: session.contact_id,
          contact_name: session.name,
          subject: `Package reservation: ${packageName}`,
          latest_message: `${session.name} reserved ${packageName}${timeframe ? ` (preferred start: ${timeframe})` : ""}.${notes ? ` Notes: ${notes}` : ""}`,
          latest_message_at: new Date().toISOString(),
          status: "open",
          priority: "urgent",
          is_read: false,
        })
        .select("id")
        .single();

      if (conv?.id) {
        await admin.from("inbox_messages").insert({
          conversation_id: conv.id,
          direction: "inbound",
          body: `Interested in ${packageName}. ${timeframe ? `Preferred start: ${timeframe}. ` : ""}${notes ?? ""}`,
          sender_name: session.name,
          is_read: false,
        });
      }
    } catch { /* non-critical */ }

    try {
      await admin.from("tasks").insert({
        title: `Book strategy call — ${session.name} (${packageName})`,
        description: `Demo reservation for ${packageName}. Email: ${session.email}. Timeframe: ${timeframe ?? "open"}. Notes: ${notes ?? "none"}.`,
        task_type: "call",
        status: "todo",
        priority: "urgent",
        linked_contact_id: session.contact_id ?? undefined,
      } as never);
    } catch { /* non-critical */ }
  })();

  return NextResponse.json({ success: true, package_id, package_name: packageName });
}
