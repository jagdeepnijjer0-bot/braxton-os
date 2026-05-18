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

  // In-app notification
  const formLabels: Record<FormType, string> = {
    landlord:      "Landlord",
    investor:      "Investor",
    maintenance:   "Maintenance",
    website_app:   "Website/App",
    ai_automation: "AI Automation",
  };

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

  // Auto-create follow-up task
  await supabase.from("tasks").insert({
    title:             TASK_TITLES[form_type],
    description:       `Form submission from ${name}${email ? ` (${email})` : ""}. Review at /submissions.`,
    task_type:         "follow_up",
    status:            "todo",
    priority:          "high",
    linked_contact_id: contact_id,
  });

  // Fire n8n webhook (no-op if N8N_ENABLED !== "true")
  await dispatchWebhook("website_lead", {
    submission_id: submission.id,
    form_type,
    contact_id,
    name,
    email,
    phone,
  });

  return NextResponse.json(
    { success: true, submission_id: submission.id, contact_id },
    { status: 201 },
  );
}
