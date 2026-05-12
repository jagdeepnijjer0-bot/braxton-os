import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ActivityType } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("contact_activities")
    .select("*")
    .eq("contact_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createServerClient();

  let body: { type: ActivityType; body: string; metadata?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.type || !body.body?.trim()) {
    return NextResponse.json({ error: "type and body are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contact_activities")
    .insert({
      contact_id: id,
      type: body.type,
      body: body.body.trim(),
      metadata: (body.metadata ?? null) as import("@/lib/supabase/types").Json,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update last_contacted when logging a call, email, or meeting
  if (["call", "email", "meeting"].includes(body.type)) {
    await supabase
      .from("contacts")
      .update({ last_contacted: new Date().toISOString() })
      .eq("id", id);
  }

  return NextResponse.json(data, { status: 201 });
}
