import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { OutreachActivityType } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_TYPES: OutreachActivityType[] = ["note","email_sent","dm_sent","call","reply_received","status_change","follow_up_set","deal_closed","call_booked"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("outreach_activities").select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: lead_id } = await params;
  const supabase = await createServerClient();
  const b = await req.json();

  if (!b.campaign_id) return NextResponse.json({ error: "campaign_id is required" }, { status: 400 });

  const insert: {
    lead_id:        string;
    campaign_id:    string;
    activity_type?: OutreachActivityType;
    body?:          string | null;
    created_by?:    string | null;
  } = { lead_id, campaign_id: b.campaign_id };

  if ("activity_type" in b && VALID_TYPES.includes(b.activity_type)) insert.activity_type = b.activity_type as OutreachActivityType;
  if ("body"       in b) insert.body       = b.body       ?? null;
  if ("created_by" in b) insert.created_by = b.created_by ?? null;

  const { data, error } = await supabase.from("outreach_activities").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
