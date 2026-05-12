import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Json, ProjectActivityType } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("project_activities")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const VALID_TYPES: ProjectActivityType[] = [
  "note", "call", "email", "meeting", "cost_update", "photo", "stage_change", "created",
];

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await req.json();

  const type: ProjectActivityType = VALID_TYPES.includes(body.type) ? body.type : "note";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("project_activities")
    .insert({
      project_id: id,
      type,
      body: text,
      metadata: (body.metadata ?? null) as Json,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
