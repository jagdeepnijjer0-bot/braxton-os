import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logAudit, buildDiff } from "@/lib/audit";
import type { Database } from "@/lib/supabase/types";

type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

const ALLOWED_FIELDS: (keyof ContactUpdate)[] = [
  "name", "company", "role", "email", "phone",
  "lead_type", "source", "status", "notes",
  "follow_up_date", "last_contacted", "assigned_to",
];

function sanitize(body: Record<string, unknown>): ContactUpdate {
  const out: ContactUpdate = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      const val = body[key];
      (out as Record<string, unknown>)[key] = val === "" ? null : val;
    }
  }
  return out;
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = sanitize(raw);

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: before } = await supabase.from("contacts").select("*").eq("id", id).single();

  const { data, error } = await supabase
    .from("contacts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({
    userId:     user?.id ?? null,
    action:     before?.status !== data.status ? "status_change" : "update",
    entityType: "contact",
    entityId:   id,
    changes:    before ? buildDiff(before as Record<string, unknown>, data as Record<string, unknown>) : undefined,
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({ userId: user?.id ?? null, action: "delete", entityType: "contact", entityId: id });

  return new NextResponse(null, { status: 204 });
}
