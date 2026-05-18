import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { suggestTasks, createTaskFromSuggestion, type TaskSuggestion } from "@/lib/ai/suggestions";

type Params = { params: Promise<{ contactId: string }> };

/**
 * POST /api/ai/suggest/:contactId
 * Returns AI task suggestions.
 * Optional body: { create: true } → also persists suggestions as tasks.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const body = await req.json().catch(() => ({})) as { create?: boolean };

  try {
    const suggestions = await suggestTasks(contactId);

    let createdIds: string[] = [];
    if (body.create && suggestions.length > 0) {
      createdIds = await Promise.all(
        suggestions.map((s: TaskSuggestion) => createTaskFromSuggestion(contactId, s))
      );
    }

    return NextResponse.json({ ok: true, contactId, suggestions, createdIds });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
