import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";
import type { WebhookEvent } from "@/lib/webhooks/dispatcher";

// POST /api/webhooks/outbound/retry
// Retries a specific failed delivery log by ID. Admin/manager only.
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

  const admin = createAdminClient();
  const { data: log } = await admin
    .from("webhook_delivery_logs")
    .select("id, event, request_body, attempts")
    .eq("id", body.id)
    .single();

  if (!log) return NextResponse.json({ error: "Log not found" }, { status: 404 });
  if (log.attempts >= 5) return NextResponse.json({ error: "Max retry attempts reached" }, { status: 400 });

  const data = (log.request_body as { data?: Record<string, unknown> })?.data ?? {};

  try {
    await dispatchWebhook(log.event as WebhookEvent, data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
