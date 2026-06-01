import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { resolveEventUrl, WEBHOOK_EVENTS, type WebhookEvent } from "@/lib/webhooks/dispatcher";

/**
 * GET /api/integrations/n8n/url-preview
 *
 * Returns the resolved URL for every webhook event so the UI can display
 * exactly what URL will be called — before the first delivery attempt.
 * Admin/manager only.
 */
export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "manager"].includes(profile.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const urls: Record<string, string | null> = {};
  await Promise.all(
    WEBHOOK_EVENTS.map(async (event: WebhookEvent) => {
      urls[event] = await resolveEventUrl(event);
    })
  );

  return NextResponse.json({ urls });
}
