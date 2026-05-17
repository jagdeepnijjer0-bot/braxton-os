import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get("campaign_id") ?? "";

  let leadsQuery = supabase.from("outreach_leads").select("status, reply_status, booked_call, closed_deal, platform, campaign_id");
  if (campaignId) leadsQuery = leadsQuery.eq("campaign_id", campaignId);

  const { data: leads, error } = await leadsQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = leads ?? [];

  const totals = {
    total:         all.length,
    contacted:     all.filter(l => l.status !== "new").length,
    replied:       all.filter(l => ["replied","interested","booked","closed"].includes(l.status)).length,
    interested:    all.filter(l => ["interested","booked","closed"].includes(l.status)).length,
    booked_calls:  all.filter(l => l.booked_call).length,
    closed_deals:  all.filter(l => l.closed_deal).length,
    positive_replies: all.filter(l => l.reply_status === "positive").length,
  };

  const rates = {
    contact_rate:  totals.total    ? +(totals.contacted   / totals.total    * 100).toFixed(1) : 0,
    reply_rate:    totals.contacted? +(totals.replied      / totals.contacted* 100).toFixed(1) : 0,
    interest_rate: totals.replied  ? +(totals.interested   / totals.replied  * 100).toFixed(1) : 0,
    book_rate:     totals.interested?+(totals.booked_calls / totals.interested*100).toFixed(1) : 0,
    close_rate:    totals.booked_calls?+(totals.closed_deals/totals.booked_calls*100).toFixed(1):0,
  };

  // By platform
  const byPlatform: Record<string, { total: number; replied: number; booked: number; closed: number }> = {};
  all.forEach(l => {
    const p = l.platform ?? "email";
    if (!byPlatform[p]) byPlatform[p] = { total: 0, replied: 0, booked: 0, closed: 0 };
    byPlatform[p].total++;
    if (["replied","interested","booked","closed"].includes(l.status)) byPlatform[p].replied++;
    if (l.booked_call) byPlatform[p].booked++;
    if (l.closed_deal) byPlatform[p].closed++;
  });

  // By status breakdown
  const byStatus: Record<string, number> = {};
  all.forEach(l => { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; });

  return NextResponse.json({ totals, rates, byPlatform, byStatus });
}
