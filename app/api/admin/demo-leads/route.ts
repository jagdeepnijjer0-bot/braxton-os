import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth-server";

/**
 * GET /api/admin/demo-leads
 *
 * Returns paginated demo sessions with per-session event summaries.
 * Admin/manager only.
 */
export async function GET(req: NextRequest) {
  await requireRole("admin");

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
  const limit  = Math.min(50, parseInt(searchParams.get("limit") ?? "25", 10));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Sessions with count
  const { data: sessions, error, count } = await admin
    .from("demo_sessions")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pull event summaries for all sessions in this page
  const sessionIds = (sessions ?? []).map(s => (s as unknown as { id: string }).id);

  let eventMap: Record<string, { event_type: string; created_at: string }[]> = {};
  if (sessionIds.length > 0) {
    const { data: events } = await admin
      .from("demo_events")
      .select("session_id, event_type, created_at")
      .in("session_id", sessionIds)
      .order("created_at", { ascending: false });

    if (events) {
      for (const e of events as unknown as { session_id: string; event_type: string; created_at: string }[]) {
        if (!eventMap[e.session_id]) eventMap[e.session_id] = [];
        eventMap[e.session_id].push({ event_type: e.event_type, created_at: e.created_at });
      }
    }
  }

  const rows = (sessions ?? []).map(s => {
    const row = s as unknown as Record<string, unknown>;
    const id = row.id as string;
    const events = eventMap[id] ?? [];
    return {
      ...row,
      events,
      book_call_clicked_at: events.find(e => e.event_type === "book_call_clicked")?.created_at ?? null,
      package_reserved_at:  events.find(e => e.event_type === "package_reserved")?.created_at ?? null,
      page_views:           events.filter(e => e.event_type.endsWith("_viewed") || e.event_type === "page_view").length,
    };
  });

  return NextResponse.json({
    sessions:    rows,
    total:       count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}
