import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ConvUpdate = Database["public"]["Tables"]["inbox_conversations"]["Update"];

const ALLOWED: (keyof ConvUpdate)[] = [
  "platform", "contact_id", "subject", "latest_message", "latest_message_at",
  "status", "assigned_category", "ai_suggested_reply", "next_action",
  "priority", "assigned_to", "is_read", "contact_name", "contact_email",
];

function sanitize(body: Record<string, unknown>): Partial<ConvUpdate> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) if (key in body) out[key] = body[key];
  return out as Partial<ConvUpdate>;
}

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("inbox_conversations").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const body = await req.json();
  const payload = sanitize(body);
  if (Object.keys(payload).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  // If contact_id is being updated, refresh denormalised name/email
  if (payload.contact_id && !payload.contact_name) {
    const { data: contact } = await supabase
      .from("contacts").select("name, email").eq("id", payload.contact_id).single();
    if (contact) {
      payload.contact_name  = contact.name;
      payload.contact_email = contact.email ?? null;
    }
  }

  const { data, error } = await supabase
    .from("inbox_conversations").update(payload as ConvUpdate).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { error } = await supabase.from("inbox_conversations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
