import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { TaskStatus, TaskPriority, TaskType } from "@/lib/supabase/types";

const VALID_STATUSES: TaskStatus[]   = ["todo","in_progress","completed","overdue","cancelled"];
const VALID_PRIORITIES: TaskPriority[] = ["low","medium","high","urgent"];
const VALID_TYPES: TaskType[]        = ["call","follow_up","meeting","refurb","finance","outreach","admin"];


export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")?.trim() ?? "";
  const status   = searchParams.get("status")  ?? "";
  const priority = searchParams.get("priority") ?? "";
  const type     = searchParams.get("type")     ?? "";
  const overdue  = searchParams.get("overdue")  === "true";
  const due_from = searchParams.get("due_from") ?? "";
  const due_to   = searchParams.get("due_to")   ?? "";
  const contact  = searchParams.get("contact_id") ?? "";
  const deal     = searchParams.get("deal_id")    ?? "";
  const project  = searchParams.get("project_id") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit    = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)));
  const offset   = (page - 1) * limit;
  const paginate = searchParams.get("paginate") === "true";

  let query = supabase
    .from("tasks")
    .select("*", paginate ? { count: "exact" } : undefined)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (search) {
    const esc = search.replace(/[%_\\]/g, "\\$&");
    query = query.ilike("title", `%${esc}%`);
  }
  if (status   && VALID_STATUSES.includes(status as TaskStatus))       query = query.eq("status",    status   as TaskStatus);
  if (priority && VALID_PRIORITIES.includes(priority as TaskPriority)) query = query.eq("priority",  priority as TaskPriority);
  if (type     && VALID_TYPES.includes(type as TaskType))              query = query.eq("task_type", type     as TaskType);
  if (overdue)   query = query.lt("due_date", new Date().toISOString().split("T")[0]).not("status", "in", '("completed","cancelled")');
  if (due_from)  query = query.gte("due_date", due_from);
  if (due_to)    query = query.lte("due_date", due_to);
  if (contact)  query = query.eq("linked_contact_id", contact);
  if (deal)     query = query.eq("linked_deal_id", deal);
  if (project)  query = query.eq("linked_project_id", project);

  if (paginate) {
    query = query.range(offset, offset + limit - 1);
  } else {
    // Always cap non-paginated responses to prevent unbounded fetches
    query = query.limit(100);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (paginate) return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const b = await req.json();

  if (!b.title || typeof b.title !== "string" || !b.title.trim())
    return NextResponse.json({ error: "title is required" }, { status: 400 });

  const insert: {
    title:                    string;
    description?:             string | null;
    status?:                  TaskStatus;
    priority?:                TaskPriority;
    task_type?:               TaskType;
    due_date?:                string | null;
    linked_contact_id?:       string | null;
    linked_deal_id?:          string | null;
    linked_project_id?:       string | null;
    linked_conversation_id?:  string | null;
  } = { title: b.title.trim() };

  if ("description" in b)  insert.description = b.description ?? null;
  if ("status"    in b && VALID_STATUSES.includes(b.status))     insert.status    = b.status    as TaskStatus;
  if ("priority"  in b && VALID_PRIORITIES.includes(b.priority)) insert.priority  = b.priority  as TaskPriority;
  if ("task_type" in b && VALID_TYPES.includes(b.task_type))     insert.task_type = b.task_type as TaskType;
  if ("due_date"             in b) insert.due_date             = b.due_date             ?? null;
  if ("linked_contact_id"    in b) insert.linked_contact_id    = b.linked_contact_id    ?? null;
  if ("linked_deal_id"       in b) insert.linked_deal_id       = b.linked_deal_id       ?? null;
  if ("linked_project_id"    in b) insert.linked_project_id    = b.linked_project_id    ?? null;
  if ("linked_conversation_id" in b) insert.linked_conversation_id = b.linked_conversation_id ?? null;

  const { data, error } = await supabase.from("tasks").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  void logAudit({ userId: user?.id ?? null, action: "create", entityType: "task", entityId: data.id });

  return NextResponse.json(data, { status: 201 });
}
