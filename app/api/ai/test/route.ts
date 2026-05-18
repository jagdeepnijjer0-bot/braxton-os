import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { scoreContact } from "@/lib/ai/scoring";
import { suggestTasks } from "@/lib/ai/suggestions";
import { runSmartNotificationSweep, detectNegativeSentiment } from "@/lib/ai/smart-notifications";
import type { Database } from "@/lib/supabase/types";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];

// ── Mock data for local testing without real DB records ───────────────────────

function buildMockContact(overrides: Partial<ContactRow> = {}): ContactRow {
  const now = new Date().toISOString();
  return {
    id:             "mock-contact-id",
    created_at:     new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at:     now,
    name:           "James Patel",
    first_name:     "James",
    last_name:      "Patel",
    company:        "Patel Property Group",
    company_id:     null,
    role:           "Director",
    email:          "james@patelpropertygroup.com",
    phone:          "+44 7700 900123",
    lead_type:      "investor",
    source:         "Referral",
    status:         "qualified",
    notes:          "Looking for BRR deals in Coventry and Birmingham. Budget £250k. High urgency — wants to move quickly.",
    follow_up_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    last_contacted: new Date(Date.now() - 5 * 86400000).toISOString(),
    assigned_to:    null,
    owner_id:       null,
    ai_score:       null,
    ai_score_label: null,
    ai_summary:     null,
    ai_scored_at:   null,
    ...overrides,
  };
}

/**
 * POST /api/ai/test
 *
 * Local testing endpoint for AI features. Does NOT save to DB.
 *
 * Body: { scenario: "score" | "suggest" | "smart_notify" | "sentiment", ...options }
 *
 * score    — scores a mock contact (or pass contact_id for a real one)
 * suggest  — suggests tasks for a real contact (contact_id required)
 * smart_notify — runs the smart notification sweep
 * sentiment — analyses sentiment of a real conversation (conversation_id required)
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const scenario = body.scenario as string;

  try {
    if (scenario === "score") {
      const contact = buildMockContact(
        typeof body.contact === "object" && body.contact ? body.contact as Partial<ContactRow> : {}
      );
      const score = await scoreContact(contact);
      return NextResponse.json({ ok: true, scenario, score, contact_used: contact });
    }

    if (scenario === "suggest") {
      const contactId = body.contact_id as string;
      if (!contactId) return NextResponse.json({ error: "contact_id required for suggest" }, { status: 400 });
      const suggestions = await suggestTasks(contactId);
      return NextResponse.json({ ok: true, scenario, suggestions });
    }

    if (scenario === "smart_notify") {
      const result = await runSmartNotificationSweep();
      return NextResponse.json({ ok: true, scenario, result });
    }

    if (scenario === "sentiment") {
      const convId = body.conversation_id as string;
      if (!convId) return NextResponse.json({ error: "conversation_id required for sentiment" }, { status: 400 });
      const result = await detectNegativeSentiment(convId);
      return NextResponse.json({ ok: true, scenario, result });
    }

    return NextResponse.json({
      error: "Unknown scenario",
      valid_scenarios: ["score", "suggest", "smart_notify", "sentiment"],
    }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, scenario, error: message }, { status: 500 });
  }
}
