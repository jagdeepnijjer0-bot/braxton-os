import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { CostDirection } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("project_costs")
    .select("*")
    .eq("project_id", id)
    .order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const body = await req.json();

  const label = typeof body.label === "string" ? body.label.trim() : "";
  const amount = Number(body.amount);
  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });
  if (isNaN(amount) || amount <= 0) return NextResponse.json({ error: "amount must be positive" }, { status: 400 });

  const direction: CostDirection = body.direction === "in" ? "in" : "out";

  const { data, error } = await supabase
    .from("project_costs")
    .insert({
      project_id: id,
      label,
      amount,
      direction,
      category: body.category ?? null,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update amount_spent on the project (sum of all 'out' costs)
  const { data: costs } = await supabase
    .from("project_costs")
    .select("amount, direction")
    .eq("project_id", id);

  if (costs) {
    const spent = costs.filter(c => c.direction === "out").reduce((s, c) => s + Number(c.amount), 0);
    await supabase.from("projects").update({ amount_spent: spent }).eq("id", id);
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);
  const costId = searchParams.get("costId");
  if (!costId) return NextResponse.json({ error: "costId required" }, { status: 400 });

  const { error } = await supabase.from("project_costs").delete().eq("id", costId).eq("project_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recalculate amount_spent
  const { data: costs } = await supabase
    .from("project_costs")
    .select("amount, direction")
    .eq("project_id", id);

  if (costs) {
    const spent = costs.filter(c => c.direction === "out").reduce((s, c) => s + Number(c.amount), 0);
    await supabase.from("projects").update({ amount_spent: spent }).eq("id", id);
  }

  return NextResponse.json({ ok: true });
}
