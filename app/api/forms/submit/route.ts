import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";
import type { FormType, LeadType } from "@/lib/supabase/types";

const FORM_TO_LEAD_TYPE: Record<FormType, LeadType> = {
  landlord:      "landlord",
  investor:      "investor",
  maintenance:   "maintenance_client",
  website_app:   "website_app_prospect",
  ai_automation: "ai_automation_prospect",
};

const FORM_TYPES: FormType[] = ["landlord", "investor", "maintenance", "website_app", "ai_automation"];

const TASK_TITLES: Record<FormType, string> = {
  landlord:      "Follow up with landlord enquiry",
  investor:      "Follow up with investor enquiry",
  maintenance:   "Review maintenance request",
  website_app:   "Follow up with website/app enquiry",
  ai_automation: "Follow up with AI automation enquiry",
};

/**
 * POST /api/forms/submit
 *
 * Public endpoint — no auth required. Uses the service-role admin client to
 * bypass RLS so anonymous website visitors can submit forms.
 *
 * Body: { form_type, name, email?, phone?, company?, message?, ...form_specific_fields }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const form_type = body.form_type as FormType;
  if (!FORM_TYPES.includes(form_type)) {
    return NextResponse.json({ error: "Invalid form_type" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Create or find contact
  const email = typeof body.email === "string" ? body.email.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  let contact_id: string | null = null;

  // Try to match existing contact by email
  if (email) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    contact_id = existing?.id ?? null;
  }

  if (!contact_id) {
    const { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .insert({
        name,
        email,
        phone,
        company: typeof body.company === "string" ? body.company.trim() : null,
        lead_type: FORM_TO_LEAD_TYPE[form_type],
        source: `form_${form_type}`,
        status: "new",
        notes: typeof body.message === "string" ? `Form enquiry: ${body.message}` : null,
      })
      .select("id")
      .single();

    if (contactErr) {
      return NextResponse.json({ error: contactErr.message }, { status: 500 });
    }
    contact_id = contact.id;
  }

  // Store form submission (all submitted fields as data blob)
  const { name: _n, form_type: _ft, ...rest } = body;
  const { data: submission, error: subErr } = await supabase
    .from("form_submissions")
    .insert({
      form_type,
      contact_id,
      data: rest,
      status: "new",
    })
    .select()
    .single();

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  // Return success immediately — core data is saved. Side-effects run fire-and-forget.
  const response = NextResponse.json(
    { success: true, submission_id: submission.id, contact_id },
    { status: 201 },
  );

  const formLabels: Record<FormType, string> = {
    landlord:      "Landlord",
    investor:      "Investor",
    maintenance:   "Maintenance",
    website_app:   "Website/App",
    ai_automation: "AI Automation",
  };

  // Fire-and-forget: inbox conversation + message, notification, task, webhook
  // Any failure is logged as a warning — the form save above already succeeded.
  void (async () => {
    const message = typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : `${formLabels[form_type]} form submission received.`;

    // 1. Inbox conversation + message
    try {
      const { data: conv } = await supabase
        .from("inbox_conversations")
        .insert({
          platform:          "website_form",
          contact_id,
          contact_name:      name,
          subject:           `${formLabels[form_type]} enquiry from ${name}`,
          latest_message:    message,
          latest_message_at: new Date().toISOString(),
          status:            "open",
          priority:          "high",
          is_read:           false,
        })
        .select("id")
        .single();

      if (conv?.id) {
        await supabase.from("inbox_messages").insert({
          conversation_id: conv.id,
          direction:       "inbound",
          body:            message,
          sender_name:     name,
          is_read:         false,
        });
      }
    } catch (e) {
      console.warn("[forms/submit] inbox insert failed:", e);
    }

    // 2. In-app notification
    try {
      await supabase.from("notifications").insert({
        title:              `New ${formLabels[form_type]} form submission: ${name}`,
        body:               `Email: ${email ?? "N/A"} — submitted via public form.`,
        type:               "system",
        priority:           "high",
        link_url:           `/submissions`,
        linked_entity_type: "contact",
        linked_entity_id:   contact_id,
        source_key:         `form_submission_${submission.id}`,
      });
    } catch (e) {
      console.warn("[forms/submit] notification insert failed:", e);
    }

    // 3. Follow-up task
    try {
      await supabase.from("tasks").insert({
        title:             TASK_TITLES[form_type],
        description:       `Form submission from ${name}${email ? ` (${email})` : ""}. Review at /submissions.`,
        task_type:         "follow_up",
        status:            "todo",
        priority:          "high",
        linked_contact_id: contact_id,
      });
    } catch (e) {
      console.warn("[forms/submit] task insert failed:", e);
    }

    // 4. n8n webhook
    try {
      await dispatchWebhook("website_lead", {
        submission_id: submission.id,
        form_type,
        contact_id,
        name,
        email,
        phone,
      });
    } catch (e) {
      console.warn("[forms/submit] webhook dispatch failed:", e);
    }
  })();

  return response;
}
