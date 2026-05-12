import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type DealUpdate = Database["public"]["Tables"]["deals"]["Update"];

const ALLOWED: (keyof DealUpdate)[] = [
  "deal_name", "address", "purchase_price", "estimated_value",
  "monthly_rent", "refurb_cost", "projected_profit",
  "investor_status", "solicitor_status", "stage",
  "notes", "next_action", "target_completion_date",
  "linked_contact_id", "assigned_to",
];

function sanitize(body: Record<string, unknown>): DealUpdate {
  const out: DealUpdate = {};
  for (const key of ALLOWED) {
    if (key in body) {
      const val = body[key];
      (out as Record<string, unknown>)[key] = val === "" ? null : val;
    }
  }
  return out;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("deals")
    .select("*, contacts:linked_contact_id(id, name, email, phone)")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();

  let raw: Record<string, unknown>;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const payload = sanitize(raw);
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("deals").update(payload).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
