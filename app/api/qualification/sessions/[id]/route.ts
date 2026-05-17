import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { QualHeat } from "@/lib/supabase/types";

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("qualification_sessions").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Props) {
  const { id } = await params;
  const b = await req.json();
  const supabase = await createServerClient();

  const update: {
    answers?:         Record<string, string>;
    score?:           number;
    heat?:            QualHeat;
    notes?:           string | null;
    suggested_reply?: string | null;
    next_action?:     string | null;
  } = {};
  if ("answers"         in b) update.answers         = b.answers;
  if ("score"           in b) update.score           = b.score;
  if ("heat"            in b) update.heat            = b.heat as QualHeat;
  if ("notes"           in b) update.notes           = b.notes ?? null;
  if ("suggested_reply" in b) update.suggested_reply = b.suggested_reply ?? null;
  if ("next_action"     in b) update.next_action     = b.next_action ?? null;

  const { data, error } = await supabase.from("qualification_sessions").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { error } = await supabase.from("qualification_sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
