import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FormStatus } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

const VALID_STATUSES: FormStatus[] = ["new", "reviewed", "contacted", "qualified", "closed"];

/**
 * PATCH /api/forms/submissions/[id]
 * Protected — requires auth. Updates status and/or notes.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();

  const update: { status?: FormStatus; notes?: string | null; assigned_to?: string | null } = {};

  if ("status" in b) {
    if (!VALID_STATUSES.includes(b.status)) {
      return NextResponse.json({ error: `Invalid status: ${b.status}` }, { status: 400 });
    }
    update.status = b.status as FormStatus;
  }
  if ("notes"       in b) update.notes       = b.notes       ?? null;
  if ("assigned_to" in b) update.assigned_to = b.assigned_to ?? null;

  const { data, error } = await supabase
    .from("form_submissions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * GET /api/forms/submissions/[id]
 * Protected — returns a single submission.
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("form_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}
