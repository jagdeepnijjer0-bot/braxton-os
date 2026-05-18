import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { processMetaWebhook, type MetaWebhookPayload } from "@/lib/meta/processor";

type Scenario = "instagram_dm" | "facebook_message" | "facebook_lead";

function buildPayload(scenario: Scenario, senderName: string, messageText: string): MetaWebhookPayload {
  const now       = Date.now();
  const mid       = `mock_${scenario}_${now}`;
  const senderId  = `mock_sender_${scenario}_${now}`;
  const pageId    = "mock_page_123456";

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
 * Authenticated endpoint for testing Meta webhook processing locally.
 * Generates a mock Meta event and runs it through the same processor
 * used by the real webhook endpoint.
 *
 * Body: {
 *   scenario:     "instagram_dm" | "facebook_message" | "facebook_lead"
 *   sender_name?: string   (cosmetic — shows in notification)
 *   message?:     string   (message text for DM scenarios)
 * }
 *
 * Returns the ProcessResult from the processor.
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();
  const scenario:    Scenario = ["instagram_dm","facebook_message","facebook_lead"].includes(b.scenario)
    ? b.scenario as Scenario : "instagram_dm";
  const senderName: string = typeof b.sender_name === "string" ? b.sender_name : "Test User";
  const messageText: string = typeof b.message === "string"
    ? b.message : "Hello! I saw your profile and I'm interested in your services.";

  const payload = buildPayload(scenario, senderName, messageText);
  const result  = await processMetaWebhook(payload);

  return NextResponse.json({ ok: true, scenario, payload, result });
}
