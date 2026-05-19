import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { scoreContact } from "@/lib/ai/scoring";
import { suggestTasks } from "@/lib/ai/suggestions";
import { runSmartNotificationSweep, detectNegativeSentiment } from "@/lib/ai/smart-notifications";
import { isMockMode } from "@/lib/ai/is-mock";
import type { Database } from "@/lib/supabase/types";

type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];

// Sentinel IDs used when mock mode is on and no real ID is supplied.
// Mock functions short-circuit before any DB access, so these never hit the database.
const MOCK_CONTACT_ID      = "mock-contact-id";
const MOCK_CONVERSATION_ID = "mock-conversation-id";

function buildMockContact(overrides: Partial<ContactRow> = {}): ContactRow {
  const now = new Date().toISOString();
  return {
    id:             MOCK_CONTACT_ID,
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
 * Body: { scenario: "score" | "suggest" | "smart_notify" | "sentiment", ...options }
 *
 * score        — scores a built-in mock contact (or pass contact_id for a real one)
 * suggest      — suggests tasks; uses mock-contact-id in mock mode if contact_id omitted
 * smart_notify — runs the smart notification sweep (real DB, real notifications)
 * sentiment    — detects sentiment; uses mock-conversation-id in mock mode if conversation_id omitted
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const scenario = body.scenario as string;
  const mock = await isMockMode();

  try {
    if (scenario === "score") {
      const contact = buildMockContact(
        typeof body.contact === "object" && body.contact ? body.contact as Partial<ContactRow> : {}
      );
      const score = await scoreContact(contact);
      return NextResponse.json({ ok: true, mock, scenario, score, contact_used: contact.name });
    }

    if (scenario === "suggest") {
      // In mock mode: use sentinel ID (suggestTasks returns before any DB access)
      // In real mode: require a real contact_id
      const contactId = (body.contact_id as string | undefined) || (mock ? MOCK_CONTACT_ID : null);
      if (!contactId) {
        return NextResponse.json({ error: "contact_id is required when mock mode is off" }, { status: 400 });
      }
      const suggestions = await suggestTasks(contactId);
      return NextResponse.json({ ok: true, mock, scenario, suggestions, contact_id_used: contactId });
    }

    if (scenario === "smart_notify") {
      const result = await runSmartNotificationSweep();
      return NextResponse.json({ ok: true, mock, scenario, result });
    }

    if (scenario === "sentiment") {
      // In mock mode: use sentinel ID (detectNegativeSentiment returns before any DB access)
      // In real mode: require a real conversation_id
      const convId = (body.conversation_id as string | undefined) || (mock ? MOCK_CONVERSATION_ID : null);
      if (!convId) {
        return NextResponse.json({ error: "conversation_id is required when mock mode is off" }, { status: 400 });
      }
      const result = await detectNegativeSentiment(convId);
      return NextResponse.json({ ok: true, mock, scenario, result, conversation_id_used: convId });
    }

    return NextResponse.json({
      error: "Unknown scenario",
      valid_scenarios: ["score", "suggest", "smart_notify", "sentiment"],
    }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, mock, scenario, error: message }, { status: 500 });
  }
}
