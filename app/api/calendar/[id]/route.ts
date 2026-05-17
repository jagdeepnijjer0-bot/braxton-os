import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_TYPES: EventType[] = ["meeting","reminder","deadline","milestone","refurb","finance","other"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("calendar_events").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const b = await req.json();

  const update: {
    title?:             string;
    description?:       string | null;
    event_type?:        EventType;
    start_datetime?:    string;
    end_datetime?:      string | null;
    all_day?:           boolean;
    color?:             string | null;
    linked_task_id?:    string | null;
    linked_deal_id?:    string | null;
    linked_project_id?: string | null;
    linked_contact_id?: string | null;
  } = {};

  if (typeof b.title            === "string")  update.title             = b.title;
  if ("description"    in b)                   update.description       = b.description       ?? null;
  if ("event_type"     in b && VALID_TYPES.includes(b.event_type)) update.event_type = b.event_type as EventType;
  if ("start_datetime" in b)                   update.start_datetime    = b.start_datetime;
  if ("end_datetime"   in b)                   update.end_datetime      = b.end_datetime      ?? null;
  if (typeof b.all_day          === "boolean") update.all_day           = b.all_day;
  if ("color"          in b)                   update.color             = b.color             ?? null;
  if ("linked_task_id"    in b)                update.linked_task_id    = b.linked_task_id    ?? null;
  if ("linked_deal_id"    in b)                update.linked_deal_id    = b.linked_deal_id    ?? null;
  if ("linked_project_id" in b)                update.linked_project_id = b.linked_project_id ?? null;
  if ("linked_contact_id" in b)                update.linked_contact_id = b.linked_contact_id ?? null;

  const { data, error } = await supabase.from("calendar_events").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
