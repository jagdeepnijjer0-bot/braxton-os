import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logAudit, buildDiff } from "@/lib/audit";
import type { TaskStatus, TaskPriority, TaskType } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_STATUSES:   TaskStatus[]   = ["todo","in_progress","completed","overdue","cancelled"];
const VALID_PRIORITIES: TaskPriority[] = ["low","medium","high","urgent"];
const VALID_TYPES:      TaskType[]     = ["call","follow_up","meeting","refurb","finance","outreach","admin"];

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("tasks").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const b = await req.json();

  const update: {
    title?:                   string;
    description?:             string | null;
    status?:                  TaskStatus;
    priority?:                TaskPriority;
    task_type?:               TaskType;
    due_date?:                string | null;
    assigned_to?:             string | null;
    linked_contact_id?:       string | null;
    linked_deal_id?:          string | null;
    linked_project_id?:       string | null;
    linked_conversation_id?:  string | null;
  } = {};

  if (typeof b.title       === "string")  update.title       = b.title;
  if ("description" in b)                 update.description = b.description ?? null;
  if ("status"    in b && VALID_STATUSES.includes(b.status))     update.status    = b.status    as TaskStatus;
  if ("priority"  in b && VALID_PRIORITIES.includes(b.priority)) update.priority  = b.priority  as TaskPriority;
  if ("task_type" in b && VALID_TYPES.includes(b.task_type))     update.task_type = b.task_type as TaskType;
  if ("due_date"             in b) update.due_date             = b.due_date             ?? null;
  if ("assigned_to"          in b) update.assigned_to          = b.assigned_to          ?? null;
  if ("linked_contact_id"    in b) update.linked_contact_id    = b.linked_contact_id    ?? null;
  if ("linked_deal_id"       in b) update.linked_deal_id       = b.linked_deal_id       ?? null;
  if ("linked_project_id"    in b) update.linked_project_id    = b.linked_project_id    ?? null;
  if ("linked_conversation_id" in b) update.linked_conversation_id = b.linked_conversation_id ?? null;

  const { data: before } = await supabase.from("tasks").select("*").eq("id", id).single();

  const { data, error } = await supabase.from("tasks").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({
    userId:     user?.id ?? null,
    action:     before?.status !== data.status ? "status_change" : "update",
    entityType: "task",
    entityId:   id,
    changes:    before ? buildDiff(before as Record<string, unknown>, data as Record<string, unknown>) : undefined,
  });

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({ userId: user?.id ?? null, action: "delete", entityType: "task", entityId: id });

  return new NextResponse(null, { status: 204 });
}
