import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { DealStage } from "@/lib/supabase/types";

const VALID_STAGES: DealStage[] = [
  "lead_found", "reviewing", "offer_made", "under_negotiation",
  "investor_interested", "legals", "refurb", "sold_completed", "dead",
];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  let body: { stage: DealStage };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!VALID_STAGES.includes(body.stage)) {
    return NextResponse.json({ error: `Invalid stage: ${body.stage}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("deals")
    .update({ stage: body.stage })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({
    userId:     user?.id ?? null,
    action:     "status_change",
    entityType: "deal",
    entityId:   id,
    changes:    { stage: [null, body.stage] },
  });

  return NextResponse.json(data);
}
