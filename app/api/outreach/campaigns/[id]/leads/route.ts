import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { OutreachPlatform, LeadStatus, ReplyStatus } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_PLATFORMS: OutreachPlatform[] = ["linkedin","email","whatsapp","facebook","instagram"];
const VALID_STATUSES: LeadStatus[]        = ["new","contacted","replied","interested","not_interested","booked","closed","ghosted","unqualified"];
const VALID_REPLY: ReplyStatus[]          = ["no_reply","replied","positive","negative","bounced","out_of_office"];

export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";
  const search = searchParams.get("search")?.trim() ?? "";

  let query = supabase.from("outreach_leads").select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  if (status && VALID_STATUSES.includes(status as LeadStatus)) query = query.eq("status", status as LeadStatus);
  if (search) {
    const esc = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(`contact_name.ilike.%${esc}%,company.ilike.%${esc}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: campaign_id } = await params;
  const supabase = await createServerClient();
  const b = await req.json();

  if (!b.contact_name?.trim()) return NextResponse.json({ error: "contact_name is required" }, { status: 400 });

  const insert: {
    campaign_id:        string;
    contact_name:       string;
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
  } = { campaign_id, contact_name: b.contact_name.trim() };

  if ("company"     in b) insert.company     = b.company     ?? null;
  if ("email"       in b) insert.email       = b.email       ?? null;
  if ("phone"       in b) insert.phone       = b.phone       ?? null;
  if ("lead_source" in b) insert.lead_source = b.lead_source ?? null;
  if ("notes"       in b) insert.notes       = b.notes       ?? null;
  if ("next_follow_up" in b) insert.next_follow_up = b.next_follow_up ?? null;
  if ("linked_contact_id" in b) insert.linked_contact_id = b.linked_contact_id ?? null;
  if ("platform"     in b && VALID_PLATFORMS.includes(b.platform)) insert.platform    = b.platform     as OutreachPlatform;
  if ("status"       in b && VALID_STATUSES.includes(b.status))    insert.status      = b.status       as LeadStatus;
  if ("reply_status" in b && VALID_REPLY.includes(b.reply_status)) insert.reply_status= b.reply_status as ReplyStatus;
  if (typeof b.step         === "number")  insert.step         = b.step;
  if (typeof b.booked_call  === "boolean") insert.booked_call  = b.booked_call;
  if (typeof b.closed_deal  === "boolean") insert.closed_deal  = b.closed_deal;

  const { data, error } = await supabase.from("outreach_leads").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto log activity
  await supabase.from("outreach_activities").insert({
    lead_id: data.id, campaign_id, activity_type: "note", body: "Lead added to campaign.",
  });

  return NextResponse.json(data, { status: 201 });
}
