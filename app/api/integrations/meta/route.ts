import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/integrations/meta
 * Returns Meta integration settings for both platforms + webhook config info.
 */
export async function GET() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("meta_integration_settings")
    .select("*")
    .order("platform");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    settings: data ?? [],
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/webhooks/inbound/meta`,
    verify_token_configured: !!process.env.META_WEBHOOK_VERIFY_TOKEN,
    app_secret_configured:   !!process.env.META_APP_SECRET,
  });
}

/**
 * PUT /api/integrations/meta
 * Update settings for one platform. Body: { platform, page_id, page_name, is_connected }
 */
export async function PUT(req: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  if (!["instagram", "facebook"].includes(b.platform)) {
    return NextResponse.json({ error: "platform must be 'instagram' or 'facebook'" }, { status: 400 });
  }

  type MetaUpdate = {
    page_id?:     string | null;
    page_name?:   string | null;
    is_connected?: boolean;
    connected_at?: string | null;
  };
  const update: MetaUpdate = {};
  if ("page_id"      in b) update.page_id      = b.page_id      ?? null;
  if ("page_name"    in b) update.page_name    = b.page_name    ?? null;
  if ("is_connected" in b) {
    update.is_connected = !!b.is_connected;
    update.connected_at = b.is_connected ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("meta_integration_settings")
    .update(update)
    .eq("platform", b.platform)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
