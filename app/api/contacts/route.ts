import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { ContactStatus, LeadType, Database } from "@/lib/supabase/types";

type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];

// Escape ilike special characters to prevent wildcard abuse
function escapeLike(s: string) {
  return s.replace(/[%_\\]/g, "\\$&");
}

// Only allow known writable columns through POST/PATCH
const ALLOWED_FIELDS: (keyof ContactInsert)[] = [
  "name", "company", "role", "email", "phone",
  "lead_type", "source", "status", "notes",
  "follow_up_date", "last_contacted", "assigned_to",
];

function sanitize(body: Record<string, unknown>): Partial<ContactInsert> {
  const out: Partial<ContactInsert> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      // Coerce empty strings to null for nullable fields
      const val = body[key];
      (out as Record<string, unknown>)[key] = val === "" ? null : val;
    }
  }
  return out;
}

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
    const safe = escapeLike(search);
    query = query.or(
      `name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%,phone.ilike.%${safe}%`
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
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = sanitize(raw);

  if (!payload.name || typeof payload.name !== "string" || !payload.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  payload.name = payload.name.trim();

  const { data, error } = await supabase
    .from("contacts")
    .insert(payload as ContactInsert)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
