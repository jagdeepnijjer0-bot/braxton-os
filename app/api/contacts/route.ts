import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ContactStatus, LeadType } from "@/lib/supabase/types";

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);

  const search    = searchParams.get("search")?.trim() ?? "";
  const status    = searchParams.get("status") as ContactStatus | null;
  const lead_type = searchParams.get("lead_type") as LeadType | null;
  const overdue   = searchParams.get("overdue") === "true";

  let query = supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }
  if (status)    query = query.eq("status", status);
  if (lead_type) query = query.eq("lead_type", lead_type);
  if (overdue) {
    const today = new Date().toISOString().split("T")[0];
    query = query.lte("follow_up_date", today).not("follow_up_date", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, ...rest } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({ name: name.trim(), ...rest })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
