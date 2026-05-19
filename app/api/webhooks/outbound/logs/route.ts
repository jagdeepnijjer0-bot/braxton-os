import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/webhooks/outbound/logs
 *
 * Paginated delivery log viewer for webhook_delivery_logs.
 * Authenticated — requires admin or manager role.
 *
 * Query params:
 *   event   — filter by event name
 *   status  — filter by status (pending | success | failed | retrying)
 *   limit   — max rows (default 50, max 200)
 *   page    — page number (default 1)
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Role check — admin or manager only
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "manager"].includes(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const event  = searchParams.get("event")  ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const rawLimit = parseInt(searchParams.get("limit") ?? "50", 10);
  const limit  = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 200);
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page   = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from("webhook_delivery_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (event)  query = query.eq("event", event);
  if (status) query = query.eq("status", status as "pending" | "success" | "failed" | "retrying");

  const { data: logs, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Summary counts (separate queries for accuracy across all rows, not just this page)
  const [successRes, failedRes, pendingRes] = await Promise.all([
    supabase.from("webhook_delivery_logs").select("id", { count: "exact", head: true }).eq("status", "success"),
    supabase.from("webhook_delivery_logs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("webhook_delivery_logs").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return NextResponse.json({
    logs:          logs ?? [],
    total:         count ?? 0,
    page,
    limit,
    total_pages:   Math.ceil((count ?? 0) / limit),
    summary: {
      total_success: successRes.count ?? 0,
      total_failed:  failedRes.count  ?? 0,
      total_pending: pendingRes.count  ?? 0,
    },
  });
}
