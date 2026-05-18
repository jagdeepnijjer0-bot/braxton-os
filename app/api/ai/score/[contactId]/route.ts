import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { scoreAndPersist } from "@/lib/ai/scoring";

type Params = { params: Promise<{ contactId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;

  try {
    const score = await scoreAndPersist(contactId);
    return NextResponse.json({ ok: true, contactId, score });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
