import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type TxUpdate = Database["public"]["Tables"]["finance_transactions"]["Update"];

const ALLOWED: (keyof TxUpdate)[] = [
  "transaction_date", "transaction_type", "category", "item_name",
  "amount", "quantity", "total_amount",
  "payment_method", "payment_status",
  "is_recurring", "recurring_interval",
  "linked_project_id", "linked_deal_id", "linked_contact_id",
  "notes",
];

function sanitize(body: Record<string, unknown>): Partial<TxUpdate> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) if (key in body) out[key] = body[key];
  return out as Partial<TxUpdate>;
}

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from("finance_transactions").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();
  const payload = sanitize(body);
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  // Recompute total_amount if amount or quantity changes
  if (payload.amount != null || payload.quantity != null) {
    // Fetch current to fill missing values
    const { data: current } = await supabase.from("finance_transactions").select("amount, quantity").eq("id", id).single();
    const amt = Number(payload.amount ?? current?.amount ?? 0);
    const qty = Number(payload.quantity ?? current?.quantity ?? 1);
    payload.total_amount = amt * qty;
  }

  const { data, error } = await supabase.from("finance_transactions").update(payload as TxUpdate).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("finance_transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
