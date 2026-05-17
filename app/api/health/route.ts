import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    // Lightweight query — just checks the connection is live
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, hint: error.hint ?? null },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, message: "Supabase connection successful" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
