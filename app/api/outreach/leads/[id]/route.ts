import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { OutreachPlatform, LeadStatus, ReplyStatus, OutreachActivityType } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_PLATFORMS: OutreachPlatform[] = ["linkedin","email","whatsapp","facebook","instagram"];
const VALID_STATUSES: LeadStatus[]        = ["new","contacted","replied","interested","not_interested","booked","closed","ghosted","unqualified"];
const VALID_REPLY: ReplyStatus[]          = ["no_reply","replied","positive","negative","bounced","out_of_office"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("outreach_leads").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const b = await req.json();

  // Fetch current for activity logging
  const { data: current } = await supabase.from("outreach_leads").select("status, campaign_id").eq("id", id).single();

  const update: {
    contact_name?:      string;
    company?:           string | null;
    email?:             string | null;
    phone?:             string | null;
    platform?:          OutreachPlatform;
    lead_source?:       string | null;
    status?:            LeadStatus;
    step?:              number;
    reply_status?:      ReplyStatus;
    booked_call?:       boolean;
    closed_deal?:       boolean;
    linked_contact_id?: string | null;
    notes?:             string | null;
    next_follow_up?:    string | null;
    last_contacted_at?: string | null;
  } = {};

  if (typeof b.contact_name === "string") update.contact_name = b.contact_name.trim();
  if ("company"     in b) update.company     = b.company     ?? null;
  if ("email"       in b) update.email       = b.email       ?? null;
  if ("phone"       in b) update.phone       = b.phone       ?? null;
  if ("lead_source" in b) update.lead_source = b.lead_source ?? null;
  if ("notes"       in b) update.notes       = b.notes       ?? null;
  if ("next_follow_up" in b) update.next_follow_up = b.next_follow_up ?? null;
  if ("last_contacted_at" in b) update.last_contacted_at = b.last_contacted_at ?? null;
  if ("linked_contact_id" in b) update.linked_contact_id = b.linked_contact_id ?? null;
  if ("platform"     in b && VALID_PLATFORMS.includes(b.platform)) update.platform     = b.platform     as OutreachPlatform;
  if ("status"       in b && VALID_STATUSES.includes(b.status))    update.status       = b.status       as LeadStatus;
  if ("reply_status" in b && VALID_REPLY.includes(b.reply_status)) update.reply_status = b.reply_status as ReplyStatus;
  if (typeof b.step         === "number")  update.step         = b.step;
  if (typeof b.booked_call  === "boolean") update.booked_call  = b.booked_call;
  if (typeof b.closed_deal  === "boolean") update.closed_deal  = b.closed_deal;

  const { data, error } = await supabase.from("outreach_leads").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-log meaningful changes
  if (current && data) {
    const campaign_id = current.campaign_id;
    if (update.status && update.status !== current.status) {
      let actType: OutreachActivityType = "status_change";
      if (update.status === "booked")  actType = "call_booked";
      if (update.status === "closed")  actType = "deal_closed";
      await supabase.from("outreach_activities").insert({
        lead_id: id, campaign_id, activity_type: actType,
        body: update.status === "booked" ? "Call booked!" : update.status === "closed" ? "Deal closed!" : `Status → ${update.status}`,
      });
    }
    if (update.next_follow_up) {
      await supabase.from("outreach_activities").insert({
        lead_id: id, campaign_id, activity_type: "follow_up_set",
        body: `Follow-up set for ${update.next_follow_up}`,
      });
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { error } = await supabase.from("outreach_leads").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
