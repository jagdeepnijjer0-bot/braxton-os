import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, TransactionType, PaymentStatus } from "@/lib/supabase/types";

type TxInsert = Database["public"]["Tables"]["finance_transactions"]["Insert"];

const ALLOWED: (keyof TxInsert)[] = [
  "transaction_date", "transaction_type", "category", "item_name",
  "amount", "quantity", "total_amount",
  "payment_method", "payment_status",
  "is_recurring", "recurring_interval",
  "linked_project_id", "linked_deal_id", "linked_contact_id",
  "notes",
];

function sanitize(body: Record<string, unknown>): Partial<TxInsert> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) if (key in body) out[key] = body[key];
  return out as Partial<TxInsert>;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);

  const search     = searchParams.get("search")?.trim() ?? "";
  const type       = searchParams.get("type") ?? "";
  const category   = searchParams.get("category") ?? "";
  const status     = searchParams.get("status") ?? "";
  const projectId  = searchParams.get("project_id") ?? "";
  const dealId     = searchParams.get("deal_id") ?? "";
  const month      = searchParams.get("month") ?? "";   // "YYYY-MM"
  const recurring  = searchParams.get("recurring") ?? "";
  const limit      = Math.min(Number(searchParams.get("limit") ?? "200"), 500);

  let query = supabase
    .from("finance_transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (search) {
    const safe = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(`item_name.ilike.%${safe}%,notes.ilike.%${safe}%,category.ilike.%${safe}%`);
  }
  if (type)      query = query.eq("transaction_type", type as TransactionType);
  if (category)  query = query.eq("category", category);
  if (status)    query = query.eq("payment_status", status as PaymentStatus);
  if (projectId) query = query.eq("linked_project_id", projectId);
  if (dealId)    query = query.eq("linked_deal_id", dealId);
  if (recurring) query = query.eq("is_recurring", recurring === "true");
  if (month) {
    // month = "YYYY-MM" → filter transaction_date between first and last day
    const [y, m] = month.split("-").map(Number);
    const from = `${month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${month}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("transaction_date", from).lte("transaction_date", to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const body = await req.json();
  const payload = sanitize(body) as TxInsert;

  if (!payload.item_name?.toString().trim()) return NextResponse.json({ error: "item_name required" }, { status: 400 });
  if (!payload.transaction_type)             return NextResponse.json({ error: "transaction_type required" }, { status: 400 });
  if (!payload.category)                     return NextResponse.json({ error: "category required" }, { status: 400 });
  if (payload.amount == null)                return NextResponse.json({ error: "amount required" }, { status: 400 });

  // Always compute total_amount server-side
  const qty = Number(payload.quantity ?? 1);
  payload.total_amount = Number(payload.amount) * qty;
  payload.quantity     = qty;

  const { data, error } = await supabase.from("finance_transactions").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
