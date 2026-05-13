import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { OutreachNiche, OutreachPlatform, CampaignStatus } from "@/lib/supabase/types";

const VALID_NICHES: OutreachNiche[]     = ["letting_agents","property_sourcers","developers","sa_operators","estate_agents","maintenance","ai_automation","website_app"];
const VALID_PLATFORMS: OutreachPlatform[] = ["linkedin","email","whatsapp","facebook","instagram"];
const VALID_STATUSES: CampaignStatus[]  = ["draft","active","paused","completed","archived"];

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")?.trim() ?? "";
  const status   = searchParams.get("status")   ?? "";
  const niche    = searchParams.get("niche")    ?? "";
  const platform = searchParams.get("platform") ?? "";

  let query = supabase.from("outreach_campaigns").select("*").order("created_at", { ascending: false });

  if (search) {
    const esc = search.replace(/[%_\\]/g, "\\$&");
    query = query.ilike("campaign_name", `%${esc}%`);
  }
  if (status   && VALID_STATUSES.includes(status   as CampaignStatus))   query = query.eq("status",   status   as CampaignStatus);
  if (niche    && VALID_NICHES.includes(niche       as OutreachNiche))    query = query.eq("niche",    niche    as OutreachNiche);
  if (platform && VALID_PLATFORMS.includes(platform as OutreachPlatform)) query = query.eq("platform", platform as OutreachPlatform);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const b = await req.json();

  if (!b.campaign_name?.trim()) return NextResponse.json({ error: "campaign_name is required" }, { status: 400 });

  const insert: {
    campaign_name:  string;
    niche?:         OutreachNiche;
    offer?:         string | null;
    platform?:      OutreachPlatform;
    status?:        CampaignStatus;
    target_count?:  number;
    description?:   string | null;
    notes?:         string | null;
  } = { campaign_name: b.campaign_name.trim() };

  if ("niche"    in b && VALID_NICHES.includes(b.niche))       insert.niche    = b.niche    as OutreachNiche;
  if ("platform" in b && VALID_PLATFORMS.includes(b.platform)) insert.platform = b.platform as OutreachPlatform;
  if ("status"   in b && VALID_STATUSES.includes(b.status))    insert.status   = b.status   as CampaignStatus;
  if ("offer"        in b) insert.offer        = b.offer        ?? null;
  if ("description"  in b) insert.description  = b.description  ?? null;
  if ("notes"        in b) insert.notes        = b.notes        ?? null;
  if (typeof b.target_count === "number") insert.target_count = b.target_count;

  const { data, error } = await supabase.from("outreach_campaigns").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
