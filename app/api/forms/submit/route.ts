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

const FORM_LABELS: Record<FormType, string> = {
  landlord:      "Landlord",
  investor:      "Investor",
  maintenance:   "Maintenance",
  website_app:   "Website/App",
  ai_automation: "AI Automation",
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
  console.log("[forms/submit] Request received");

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

  console.log(`[forms/submit] form_type=${form_type} name=${name}`);

  const supabase = createAdminClient();

  const email = typeof body.email === "string" ? body.email.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  let contact_id: string | null = null;

  if (email) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    contact_id = existing?.id ?? null;
    if (contact_id) console.log(`[forms/submit] matched existing contact ${contact_id}`);
  }

  if (!contact_id) {
    const { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .insert({
        name,
        email,
        phone,
        company:   typeof body.company === "string" ? body.company.trim() : null,
        lead_type: FORM_TO_LEAD_TYPE[form_type],
        source:    `form_${form_type}`,
        status:    "new",
        notes:     typeof body.message === "string" ? `Form enquiry: ${body.message}` : null,
      })
      .select("id")
      .single();

    if (contactErr) {
      console.error("[forms/submit] contact insert error:", contactErr.message);
      return NextResponse.json({ error: contactErr.message }, { status: 500 });
    }
    contact_id = contact.id;
    console.log(`[forms/submit] created contact ${contact_id}`);
  }

  const { name: _n, form_type: _ft, ...rest } = body;
  const { data: submission, error: subErr } = await supabase
    .from("form_submissions")
    .insert({
      form_type,
      contact_id,
      data:   rest,
      status: "new",
    })
    .select()
    .single();

  if (subErr) {
    console.error("[forms/submit] submission insert error:", subErr.message);
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }
  console.log(`[forms/submit] submission saved: ${submission.id}`);

  // ── n8n webhook — called BEFORE returning response so Vercel doesn't
  // terminate the lambda first. Wrapped in a 5-second timeout so it can
  // never block or fail the form. ─────────────────────────────────────────
  const webhookPayload = {
    submission_id: submission.id,
    form_type,
    contact_id,
    name,
    email,
    phone,
    ...rest,
  };

  const N8N_URL =
    process.env.N8N_WEBHOOK_WEBSITE_LEAD ??
    (process.env.N8N_WEBHOOK_BASE_URL
      ? `${process.env.N8N_WEBHOOK_BASE_URL.replace(/\/$/, "")}/website_lead`
      : null);

  console.log(`[forms/submit] n8n URL resolved: ${N8N_URL ?? "(none — check N8N_WEBHOOK_BASE_URL env var)"}`);
  console.log(`[forms/submit] n8n payload:`, JSON.stringify(webhookPayload));

  let webhookOk = false;
  if (N8N_URL) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      console.log(`[forms/submit] POSTing to n8n: ${N8N_URL}`);

      const r = await fetch(N8N_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(webhookPayload),
        signal:  controller.signal,
      });
      clearTimeout(timer);

      const responseText = await r.text().catch(() => "");
      console.log(`[forms/submit] n8n response: HTTP ${r.status} — ${responseText.slice(0, 200)}`);

      if (r.ok) {
        webhookOk = true;
      } else {
        console.warn(`[forms/submit] n8n returned HTTP ${r.status}: ${responseText}`);
      }
    } catch (err) {
      console.warn("[forms/submit] n8n webhook call failed:", err instanceof Error ? err.message : err);
    }
  } else {
    // Fallback: use dispatcher which reads from DB n8n_settings
    console.log("[forms/submit] no direct URL — falling back to dispatchWebhook (reads DB settings)");
    try {
      await Promise.race([
        dispatchWebhook("website_lead", webhookPayload),
        new Promise<void>(resolve => setTimeout(resolve, 4500)),
      ]);
      webhookOk = true;
      console.log("[forms/submit] dispatchWebhook completed");
    } catch (err) {
      console.warn("[forms/submit] dispatchWebhook failed:", err instanceof Error ? err.message : err);
    }
  }

  // ── Fire-and-forget: inbox, notification, task ────────────────────────────
  // These run after the response is returned. Failures only log warnings.
  void (async () => {
    const message = typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : `${FORM_LABELS[form_type]} form submission received.`;

    try {
      const { data: conv } = await supabase
        .from("inbox_conversations")
        .insert({
          platform:          "website_form",
          contact_id,
          contact_name:      name,
          subject:           `${FORM_LABELS[form_type]} enquiry from ${name}`,
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

    try {
      await supabase.from("notifications").insert({
        title:              `New ${FORM_LABELS[form_type]} form submission: ${name}`,
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
  })();

  console.log(`[forms/submit] returning 201 — webhook_ok=${webhookOk}`);
  return NextResponse.json(
    { success: true, submission_id: submission.id, contact_id, webhook_ok: webhookOk },
    { status: 201 },
  );
}
