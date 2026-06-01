import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { retryDelivery } from "@/lib/webhooks/dispatcher";

// POST /api/webhooks/outbound/retry
// Retries a specific delivery log by ID, updating the original row.
// Admin/manager only.
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "manager"].includes(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { id: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const result = await retryDelivery(body.id);

  return NextResponse.json(
    { ok: result.ok, http_status: result.httpStatus, error: result.error },
    { status: result.ok ? 200 : 502 },
  );
}
