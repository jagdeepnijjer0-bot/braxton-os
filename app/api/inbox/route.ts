import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { Database, InboxPlatform, InboxStatus, InboxPriority } from "@/lib/supabase/types";

type ConvInsert = Database["public"]["Tables"]["inbox_conversations"]["Insert"];

const ALLOWED: (keyof ConvInsert)[] = [
  "platform", "contact_id", "subject", "latest_message", "latest_message_at",
  "status", "assigned_category", "ai_suggested_reply", "next_action",
  "priority", "assigned_to", "is_read", "contact_name", "contact_email",
];

function sanitize(body: Record<string, unknown>): Partial<ConvInsert> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) if (key in body) out[key] = body[key];
  return out as Partial<ConvInsert>;
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);

  const search   = searchParams.get("search")?.trim() ?? "";
  const platform = searchParams.get("platform") ?? "";
  const status   = searchParams.get("status") ?? "";
  const priority = searchParams.get("priority") ?? "";
  const unread   = searchParams.get("unread") ?? "";

  let query = supabase
    .from("inbox_conversations")
    .select("*")
    .order("latest_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    const safe = search.replace(/[%_\\]/g, "\\$&");
    query = query.or(`subject.ilike.%${safe}%,latest_message.ilike.%${safe}%,contact_name.ilike.%${safe}%`);
  }
  if (platform) query = query.eq("platform", platform as InboxPlatform);
  if (status)   query = query.eq("status", status as InboxStatus);
  if (priority) query = query.eq("priority", priority as InboxPriority);
  if (unread === "true") query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const body = await req.json();
  const payload = sanitize(body) as ConvInsert;

  if (!payload.platform) return NextResponse.json({ error: "platform is required" }, { status: 400 });

  // If contact_id provided, pull contact name/email to denormalise
  if (payload.contact_id && !payload.contact_name) {
    const { data: contact } = await supabase
      .from("contacts").select("name, email").eq("id", payload.contact_id).single();
    if (contact) {
      payload.contact_name  = contact.name;
      payload.contact_email = contact.email ?? null;
    }
  }

  const { data, error } = await supabase.from("inbox_conversations").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
