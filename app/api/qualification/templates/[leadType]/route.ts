import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ leadType: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  const { leadType } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("qualification_templates")
    .select("*")
    .eq("lead_type", leadType)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}
