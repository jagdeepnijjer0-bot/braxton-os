import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ProjectStage } from "@/lib/supabase/types";

const VALID_STAGES: ProjectStage[] = [
  "planning", "demolition", "first_fix", "second_fix",
  "decorating", "snagging", "completed", "on_hold",
];

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { stage } = await req.json();

  if (!VALID_STAGES.includes(stage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ stage: stage as ProjectStage })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
