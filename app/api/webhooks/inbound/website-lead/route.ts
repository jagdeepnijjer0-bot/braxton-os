import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verifyInboundSignature, dispatchWebhook } from "@/lib/webhooks/dispatcher";
import type { LeadType } from "@/lib/supabase/types";

const VALID_LEAD_TYPES: LeadType[] = [
  "letting_agent","sourcer","developer","landlord","investor",
  "maintenance_client","website_app_prospect","ai_automation_prospect",
];

/**
 * POST /api/webhooks/inbound/website-lead
 *
 * Receives a website form submission (from n8n, Typeform, Tally, etc.)
 * and creates a CRM contact + fires the website_lead n8n webhook.
 *
 * Expected body:
 *   { name, email?, phone?, company?, message?, source?, lead_type? }
 *
 * Security: validated via X-Braxton-Signature header (HMAC-SHA256)
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig     = req.headers.get("x-braxton-signature") ?? "";

  if (process.env.N8N_WEBHOOK_SECRET && !verifyInboundSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const notes = typeof body.message === "string"
    ? `Website enquiry: ${body.message}`
    : null;

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      name,
      email:     typeof body.email    === "string" ? body.email.trim()   : null,
      phone:     typeof body.phone    === "string" ? body.phone.trim()   : null,
      company:   typeof body.company  === "string" ? body.company.trim() : null,
      source:    typeof body.source   === "string" ? body.source         : "website",
      status:    "new",
      lead_type: (VALID_LEAD_TYPES.includes(body.lead_type as LeadType) ? body.lead_type : "website_app_prospect") as LeadType,
      notes,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json(
    { success: true, contact_id: contact.id },
    { status: 201 },
  );

  // Fire-and-forget: notification and webhook — failures only log warnings
  void (async () => {
    try {
      await supabase.from("notifications").insert({
        title:              `New website lead: ${contact.name}`,
        body:               `Email: ${contact.email ?? "N/A"} — auto-imported from website form.`,
        type:               "system",
        priority:           "high",
        link_url:           `/crm/${contact.id}`,
        linked_entity_type: "contact",
        linked_entity_id:   contact.id,
        source_key:         `website_lead_${contact.id}`,
      });
    } catch (e) {
      console.warn("[webhooks/website-lead] notification insert failed:", e);
    }

    try {
      await dispatchWebhook("website_lead", {
        contact_id: contact.id,
        name:       contact.name,
        email:      contact.email,
        phone:      contact.phone,
        company:    contact.company,
        source:     contact.source,
        lead_type:  contact.lead_type,
      });
    } catch (e) {
      console.warn("[webhooks/website-lead] webhook dispatch failed:", e);
    }
  })();

  return response;
}
