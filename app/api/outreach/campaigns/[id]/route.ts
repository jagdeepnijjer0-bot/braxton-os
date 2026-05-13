import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { OutreachNiche, OutreachPlatform, CampaignStatus } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_NICHES: OutreachNiche[]     = ["letting_agents","property_sourcers","developers","sa_operators","estate_agents","maintenance","ai_automation","website_app"];
const VALID_PLATFORMS: OutreachPlatform[] = ["linkedin","email","whatsapp","facebook","instagram"];
const VALID_STATUSES: CampaignStatus[]  = ["draft","active","paused","completed","archived"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from("outreach_campaigns").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const b = await req.json();

  const update: {
    campaign_name?:  string;
    niche?:          OutreachNiche;
    offer?:          string | null;
    platform?:       OutreachPlatform;
    status?:         CampaignStatus;
    target_count?:   number;
    description?:    string | null;
    notes?:          string | null;
  } = {};

  if (typeof b.campaign_name === "string") update.campaign_name = b.campaign_name.trim();
  if ("niche"    in b && VALID_NICHES.includes(b.niche))       update.niche    = b.niche    as OutreachNiche;
  if ("platform" in b && VALID_PLATFORMS.includes(b.platform)) update.platform = b.platform as OutreachPlatform;
  if ("status"   in b && VALID_STATUSES.includes(b.status))    update.status   = b.status   as CampaignStatus;
  if ("offer"        in b) update.offer        = b.offer        ?? null;
  if ("description"  in b) update.description  = b.description  ?? null;
  if ("notes"        in b) update.notes        = b.notes        ?? null;
  if (typeof b.target_count === "number") update.target_count = b.target_count;

  const { data, error } = await supabase.from("outreach_campaigns").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("outreach_campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
