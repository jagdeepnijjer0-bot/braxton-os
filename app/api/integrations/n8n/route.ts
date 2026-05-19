import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { invalidateN8nSettingsCache } from "@/lib/webhooks/dispatcher";

// GET /api/integrations/n8n — read current n8n settings
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "manager"].includes(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("n8n_settings").select("*").limit(1).single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also surface whether env vars are set (so UI can show fallback status)
  return NextResponse.json({
    settings: data ?? null,
    env_configured: {
      enabled:   process.env.N8N_ENABLED === "true",
      base_url:  !!process.env.N8N_WEBHOOK_BASE_URL,
      secret:    !!process.env.N8N_WEBHOOK_SECRET,
    },
  });
}

// POST /api/integrations/n8n — upsert n8n settings (admin only)
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: { enabled?: boolean; base_url?: string | null; event_config?: Record<string, unknown> };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Check if row exists
  const { data: existing } = await supabase
    .from("n8n_settings").select("id").limit(1).single();

  type EventCfg = Record<string, { url?: string | null; enabled?: boolean }>;

  let result;
  if (existing?.id) {
    const update: import("@/lib/supabase/types").Database["public"]["Tables"]["n8n_settings"]["Update"] = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };
    if ("enabled"      in body && body.enabled      !== undefined) update.enabled      = body.enabled;
    if ("base_url"     in body) update.base_url      = body.base_url ?? null;
    if ("event_config" in body) update.event_config  = body.event_config as EventCfg;
    result = await supabase
      .from("n8n_settings").update(update).eq("id", existing.id).select().single();
  } else {
    result = await supabase
      .from("n8n_settings")
      .insert({
        enabled:      body.enabled      ?? false,
        base_url:     body.base_url     ?? null,
        event_config: (body.event_config ?? {}) as EventCfg,
        updated_by:   user.id,
      })
      .select().single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });

  // Invalidate the in-memory dispatcher cache so changes take effect immediately
  invalidateN8nSettingsCache();

  return NextResponse.json({ ok: true, settings: result.data });
}
