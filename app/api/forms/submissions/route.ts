import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { FormType, FormStatus } from "@/lib/supabase/types";

const VALID_FORM_TYPES: FormType[]   = ["landlord", "investor", "maintenance", "website_app", "ai_automation"];
const VALID_STATUSES: FormStatus[]   = ["new", "reviewed", "contacted", "qualified", "closed"];

/**
 * GET /api/forms/submissions
 * Protected — requires auth. Supports ?form_type=&status=&limit=&offset=
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const form_type = searchParams.get("form_type") as FormType | null;
  const status    = searchParams.get("status") as FormStatus | null;
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset    = parseInt(searchParams.get("offset") ?? "0");

  let q = supabase
    .from("form_submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (form_type && VALID_FORM_TYPES.includes(form_type)) q = q.eq("form_type", form_type);
  if (status && VALID_STATUSES.includes(status))         q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
