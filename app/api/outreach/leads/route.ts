import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/supabase/types";

const VALID_STATUSES: LeadStatus[] = ["new","contacted","replied","interested","not_interested","booked","closed","ghosted","unqualified"];

// Cross-campaign lead list (used for follow-up reminders and analytics)
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);
  const status     = searchParams.get("status")      ?? "";
  const followUp   = searchParams.get("follow_up")   === "true";
  const booked     = searchParams.get("booked")      === "true";
  const closed     = searchParams.get("closed")      === "true";
  const campaignId = searchParams.get("campaign_id") ?? "";

  let query = supabase.from("outreach_leads").select("*").order("next_follow_up", { ascending: true, nullsFirst: false });

  if (status     && VALID_STATUSES.includes(status as LeadStatus)) query = query.eq("status", status as LeadStatus);
  if (campaignId) query = query.eq("campaign_id", campaignId);
  if (followUp)   query = query.lte("next_follow_up", new Date().toISOString().split("T")[0]).not("status", "in", '("closed","not_interested","ghosted","unqualified")');
  if (booked)     query = query.eq("booked_call", true);
  if (closed)     query = query.eq("closed_deal", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
