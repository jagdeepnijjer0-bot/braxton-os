import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { DealActivityType, Json } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("deal_activities")
    .select("*")
    .eq("deal_id", id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  let body: { type: DealActivityType; body: string; metadata?: Record<string, unknown> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.type || !body.body?.trim()) {
    return NextResponse.json({ error: "type and body are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("deal_activities")
    .insert({
      deal_id: id,
      type: body.type,
      body: body.body.trim(),
      metadata: (body.metadata ?? null) as Json,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
