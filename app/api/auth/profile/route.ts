import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await req.json();

  const update: {
    full_name?:  string | null;
    job_title?:  string | null;
    phone?:      string | null;
    avatar_url?: string | null;
  } = {};
  if ("full_name"  in b) update.full_name  = b.full_name  ?? null;
  if ("job_title"  in b) update.job_title  = b.job_title  ?? null;
  if ("phone"      in b) update.phone      = b.phone      ?? null;
  if ("avatar_url" in b) update.avatar_url = b.avatar_url ?? null;

  const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
