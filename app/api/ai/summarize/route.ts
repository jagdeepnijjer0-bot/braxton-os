import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { summarizeContact, summarizeConversation, summarizeFormSubmission } from "@/lib/ai/summaries";
import { isMockMode } from "@/lib/ai/is-mock";

/**
 * POST /api/ai/summarize
 * Body: { type: "contact" | "conversation" | "submission", id: string }
 */
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { type?: string; id?: string };
  const { type, id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    let summary: string;
    if (type === "contact")           summary = await summarizeContact(id);
    else if (type === "conversation") summary = await summarizeConversation(id);
    else if (type === "submission")   summary = await summarizeFormSubmission(id);
    else return NextResponse.json({ error: "type must be contact | conversation | submission" }, { status: 400 });

    const mock = await isMockMode();
    return NextResponse.json({ ok: true, mock, type, id, summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
