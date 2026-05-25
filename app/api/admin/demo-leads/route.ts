import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth-server";

/**
 * GET /api/admin/demo-leads
 *
 * Returns paginated demo sessions for the admin view.
 * Admin/manager only.
 */
export async function GET(req: NextRequest) {
  await requireRole("admin");

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "25", 10));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  const { data, error, count } = await admin
    .from("demo_sessions")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .select("*" as any, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    sessions:    data ?? [],
    total:       count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}
