import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { Database, DealStage, InvestorStatus } from "@/lib/supabase/types";

type DealInsert = Database["public"]["Tables"]["deals"]["Insert"];

const ALLOWED: (keyof DealInsert)[] = [
  "deal_name", "address", "purchase_price", "estimated_value",
  "monthly_rent", "refurb_cost", "projected_profit",
  "investor_status", "solicitor_status", "stage",
  "notes", "next_action", "target_completion_date",
  "linked_contact_id", "assigned_to",
];

function sanitize(body: Record<string, unknown>): Partial<DealInsert> {
  const out: Partial<DealInsert> = {};
  for (const key of ALLOWED) {
    if (key in body) {
      const val = body[key];
      (out as Record<string, unknown>)[key] = val === "" ? null : val;
    }
  }
  return out;
}

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search")?.trim() ?? "";
  const stage  = searchParams.get("stage") as DealStage | null;
  const investor_status = searchParams.get("investor_status");
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const offset = (page - 1) * limit;
  const paginate = searchParams.get("paginate") === "true";

  let query = supabase
    .from("deals")
    .select("*, contacts:linked_contact_id(id, name, email, phone)", paginate ? { count: "exact" } : undefined)
    .order("created_at", { ascending: false });

  if (search) {
    const safe = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(`deal_name.ilike.%${safe}%,address.ilike.%${safe}%`);
  }
  if (stage)           query = query.eq("stage", stage as DealStage);
  if (investor_status) query = query.eq("investor_status", investor_status as InvestorStatus);

  if (paginate) query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (paginate) return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  let raw: Record<string, unknown>;
  try { raw = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const payload = sanitize(raw);
  if (!payload.deal_name?.trim()) {
    return NextResponse.json({ error: "deal_name is required" }, { status: 400 });
  }
  payload.deal_name = payload.deal_name.trim();

  const { data, error } = await supabase
    .from("deals")
    .insert(payload as DealInsert)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({ userId: user?.id ?? null, action: "create", entityType: "deal", entityId: data.id });

  return NextResponse.json(data, { status: 201 });
}
