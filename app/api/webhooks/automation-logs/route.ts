import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/webhooks/automation-logs — paginated automation_logs viewer
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "manager"].includes(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  // Accept both ?event= (admin page) and ?event_name= (legacy)
  const eventName = searchParams.get("event") ?? searchParams.get("event_name") ?? undefined;
  const status    = searchParams.get("status") ?? undefined;
  const limit     = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const page      = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const offset    = (page - 1) * limit;

  let query = supabase
    .from("automation_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (eventName) query = query.eq("event_name", eventName);
  if (status)    query = query.eq("status", status as "ok" | "partial" | "failed");

  const { data: logs, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    logs:        logs ?? [],
    total:       count ?? 0,
    page,
    limit,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
}
