import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

const ALLOWED: (keyof ProjectUpdate)[] = [
  "project_name", "linked_deal_id", "contractor_name", "stage",
  "budget", "amount_spent", "projected_profit", "progress_percentage",
  "start_date", "target_completion_date", "notes", "assigned_to",
];

function sanitize(body: Record<string, unknown>): Partial<ProjectUpdate> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) if (key in body) out[key] = body[key];
  return out as Partial<ProjectUpdate>;
}

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();
  const payload = sanitize(body);
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  const { data, error } = await supabase.from("projects").update(payload as ProjectUpdate).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
