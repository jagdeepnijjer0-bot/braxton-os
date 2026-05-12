import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/supabase/types";

const VALID_TYPES: EventType[] = ["meeting","reminder","deadline","milestone","refurb","finance","other"];

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(req.url);
  const from  = searchParams.get("from") ?? "";
  const to    = searchParams.get("to")   ?? "";
  const type  = searchParams.get("type") ?? "";

  let query = supabase.from("calendar_events").select("*").order("start_datetime", { ascending: true });

  if (from) query = query.gte("start_datetime", from);
  if (to)   query = query.lte("start_datetime", to);
  if (type && VALID_TYPES.includes(type as EventType)) query = query.eq("event_type", type as EventType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const b = await req.json();

  if (!b.title || typeof b.title !== "string" || !b.title.trim())
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!b.start_datetime)
    return NextResponse.json({ error: "start_datetime is required" }, { status: 400 });

  const insert: {
    title:              string;
    start_datetime:     string;
    description?:       string | null;
    event_type?:        EventType;
    end_datetime?:      string | null;
    all_day?:           boolean;
    color?:             string | null;
    linked_task_id?:    string | null;
    linked_deal_id?:    string | null;
    linked_project_id?: string | null;
    linked_contact_id?: string | null;
  } = { title: b.title.trim(), start_datetime: b.start_datetime };

  if ("description"    in b)  insert.description    = b.description    ?? null;
  if ("event_type"     in b && VALID_TYPES.includes(b.event_type)) insert.event_type = b.event_type as EventType;
  if ("end_datetime"   in b)  insert.end_datetime   = b.end_datetime   ?? null;
  if (typeof b.all_day === "boolean") insert.all_day = b.all_day;
  if ("color"          in b)  insert.color          = b.color          ?? null;
  if ("linked_task_id"    in b) insert.linked_task_id    = b.linked_task_id    ?? null;
  if ("linked_deal_id"    in b) insert.linked_deal_id    = b.linked_deal_id    ?? null;
  if ("linked_project_id" in b) insert.linked_project_id = b.linked_project_id ?? null;
  if ("linked_contact_id" in b) insert.linked_contact_id = b.linked_contact_id ?? null;

  const { data, error } = await supabase.from("calendar_events").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
