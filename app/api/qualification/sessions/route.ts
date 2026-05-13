import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { QualHeat, QualLeadType } from "@/lib/supabase/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const contactId      = searchParams.get("contact_id");
  const conversationId = searchParams.get("conversation_id");

  const supabase = createServerClient();
  let q = supabase.from("qualification_sessions").select("*").order("created_at", { ascending: false });
  if (contactId)      q = q.eq("contact_id",      contactId);
  if (conversationId) q = q.eq("conversation_id", conversationId);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const b = await req.json();
  if (!b.lead_type) return NextResponse.json({ error: "lead_type required" }, { status: 400 });

  const supabase = createServerClient();
  const insert: {
    lead_type:       QualLeadType;
    answers:         Record<string, string>;
    score:           number;
    heat:            QualHeat;
    contact_id?:     string | null;
    conversation_id?: string | null;
    notes?:          string | null;
    suggested_reply?: string | null;
    next_action?:    string | null;
    created_by?:     string | null;
  } = {
    lead_type: b.lead_type as QualLeadType,
    answers:   typeof b.answers === "object" ? b.answers : {},
    score:     typeof b.score === "number" ? b.score : 0,
    heat:      (["hot","warm","cold"].includes(b.heat) ? b.heat : "cold") as QualHeat,
  };
  if ("contact_id"      in b) insert.contact_id      = b.contact_id ?? null;
  if ("conversation_id" in b) insert.conversation_id = b.conversation_id ?? null;
  if ("notes"           in b) insert.notes           = b.notes ?? null;
  if ("suggested_reply" in b) insert.suggested_reply = b.suggested_reply ?? null;
  if ("next_action"     in b) insert.next_action     = b.next_action ?? null;
  if ("created_by"      in b) insert.created_by      = b.created_by ?? null;

  const { data, error } = await supabase.from("qualification_sessions").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
