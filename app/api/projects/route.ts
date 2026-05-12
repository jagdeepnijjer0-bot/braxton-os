import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, ProjectStage } from "@/lib/supabase/types";

type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];

const ALLOWED: (keyof ProjectInsert)[] = [
  "project_name", "linked_deal_id", "contractor_name", "stage",
  "budget", "amount_spent", "projected_profit", "progress_percentage",
  "start_date", "target_completion_date", "notes", "assigned_to",
];

function sanitize(body: Record<string, unknown>): Partial<ProjectInsert> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) if (key in body) out[key] = body[key];
  return out as Partial<ProjectInsert>;
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const stage  = searchParams.get("stage") ?? "";

  let query = supabase.from("projects").select("*, deals:linked_deal_id(id, deal_name, address)").order("created_at", { ascending: false });

  if (search) {
    const safe = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(`project_name.ilike.%${safe}%,contractor_name.ilike.%${safe}%`);
  }
  if (stage) query = query.eq("stage", stage as ProjectStage);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();
  const payload = sanitize(body);
  if (!payload.project_name) return NextResponse.json({ error: "project_name is required" }, { status: 400 });

  const { data, error } = await supabase.from("projects").insert(payload as ProjectInsert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
