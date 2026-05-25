import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDemoSession, DEMO_COOKIE } from "@/lib/demo/session";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

/**
 * POST /api/demo/access
 *
 * Creates a demo session for a new prospect. Upserts a CRM contact with
 * status="demo_user", creates inbox conversation, notification, and fires
 * the demo_access_created webhook.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const business_name = typeof body.business_name === "string" ? body.business_name.trim() : "";
  const industry = typeof body.industry === "string" ? body.industry.trim() : null;
  const problem = typeof body.problem === "string" ? body.problem.trim() : null;

  if (!name || !email) {
    return NextResponse.json({ error: "name and email are required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Upsert CRM contact
  let contact_id: string | null = null;
  const { data: existing } = await admin
    .from("contacts")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    contact_id = existing.id;
  } else {
    const { data: newContact } = await admin
      .from("contacts")
      .insert({
        name,
        email,
        company: business_name || null,
        lead_type: "website_app_prospect",
        source: "demo_funnel",
        status: "demo_user",
        notes: problem ? `Demo user. Problem: ${problem}` : "Demo user via demo funnel.",
      })
      .select("id")
      .single();
    contact_id = newContact?.id ?? null;
  }

  // Create demo session
  const session = await createDemoSession({
    name,
    email,
    business_name: business_name || undefined,
    industry: industry || undefined,
    problem: problem || undefined,
    contact_id,
  });

  if (!session) {
    return NextResponse.json({ error: "Failed to create demo session" }, { status: 500 });
  }

  // Webhook — fire before response
  try {
    await Promise.race([
      dispatchWebhook("demo_access_created", {
        session_id: session.id,
        contact_id,
        name,
        email,
        business_name,
        industry,
        problem,
      }),
      new Promise<void>(r => setTimeout(r, 4000)),
    ]);
  } catch {
    // non-critical
  }

  // Fire-and-forget: inbox + notification
  void (async () => {
    try {
      const { data: conv } = await admin
        .from("inbox_conversations")
        .insert({
          platform: "website_form",
          contact_id,
          contact_name: name,
          subject: `Demo access — ${name}${business_name ? ` (${business_name})` : ""}`,
          latest_message: problem ?? "Signed up for demo access.",
          latest_message_at: new Date().toISOString(),
          status: "open",
          priority: "high",
          is_read: false,
        })
        .select("id")
        .single();

      if (conv?.id) {
        await admin.from("inbox_messages").insert({
          conversation_id: conv.id,
          direction: "inbound",
          body: problem ?? "Signed up for demo access.",
          sender_name: name,
          is_read: false,
        });
      }
    } catch { /* non-critical */ }

    try {
      await admin.from("notifications").insert({
        title: `New demo signup: ${name}`,
        body: `${email}${business_name ? ` — ${business_name}` : ""}`,
        type: "system",
        priority: "high",
        link_url: "/admin/demo-leads",
        linked_entity_type: "contact",
        linked_entity_id: contact_id,
        source_key: `demo_session_${session.id}`,
      });
    } catch { /* non-critical */ }

    try {
      await admin.from("tasks").insert({
        title: `Follow up demo prospect: ${name}`,
        description: `${email}${business_name ? ` — ${business_name}` : ""}${problem ? `\nProblem: ${problem}` : ""}`,
        task_type: "follow_up",
        status: "todo",
        priority: "high",
        linked_contact_id: contact_id,
      });
    } catch { /* non-critical */ }
  })();

  const response = NextResponse.json(
    { success: true, session_id: session.id },
    { status: 201 },
  );

  response.cookies.set(DEMO_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 72 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
