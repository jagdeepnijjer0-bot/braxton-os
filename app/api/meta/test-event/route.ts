import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { processMetaWebhook, type MetaWebhookPayload } from "@/lib/meta/processor";

type Scenario = "instagram_dm" | "facebook_message" | "facebook_lead";

function buildPayload(scenario: Scenario, messageText: string): MetaWebhookPayload {
  const now      = Date.now();
  const mid      = `mock_msg_${now}`;
  const senderId = `mock_sender_${scenario}_${now}`;
  const pageId   = "mock_page_123456";

  if (scenario === "instagram_dm") {
    return {
      object: "instagram",
      entry: [{
        id:   pageId,
        time: Math.floor(now / 1000),
        messaging: [{
          sender:    { id: senderId },
          recipient: { id: pageId },
          timestamp: now,
          message:   { mid, text: messageText },
        }],
      }],
    };
  }

  if (scenario === "facebook_message") {
    return {
      object: "page",
      entry: [{
        id:   pageId,
        time: Math.floor(now / 1000),
        messaging: [{
          sender:    { id: senderId },
          recipient: { id: pageId },
          timestamp: now,
          message:   { mid, text: messageText },
        }],
      }],
    };
  }

  // facebook_lead
  return {
    object: "page",
    entry: [{
      id:   pageId,
      time: Math.floor(now / 1000),
      changes: [{
        field: "leadgen",
        value: {
          form_id:      `mock_form_${now}`,
          leadgen_id:   `mock_lead_${now}`,
          page_id:      pageId,
          created_time: Math.floor(now / 1000),
        },
      }],
    }],
  };
}

/**
 * POST /api/meta/test-event
 *
 * Generates a mock Meta event and runs it through the full processor.
 * Check /inbox, /crm, /notifications after testing.
 *
 * Body: {
 *   scenario: "instagram_dm" | "facebook_message" | "facebook_lead"
 *   message?: string   (message text for DM scenarios)
 * }
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { /* use defaults */ }

  const scenario: Scenario = (["instagram_dm","facebook_message","facebook_lead"] as const).includes(b.scenario as Scenario)
    ? b.scenario as Scenario
    : "instagram_dm";

  const messageText = typeof b.message === "string"
    ? b.message
    : "Hello! I saw your profile and I'm interested in your services.";

  const payload = buildPayload(scenario, messageText);

  try {
    const result = await processMetaWebhook(payload);
    return NextResponse.json({ ok: true, scenario, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[meta-test-event] fatal error:", message);
    return NextResponse.json(
      { ok: false, scenario, error: message, result: { processed: 0, skipped: 0, errors: [message], detail: [] } },
      { status: 500 },
    );
  }
}
