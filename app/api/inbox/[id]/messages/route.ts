import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { MessageDirection, InboxStatus } from "@/lib/supabase/types";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("inbox_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

const VALID_DIRECTIONS: MessageDirection[] = ["inbound", "outbound"];

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = await createServerClient();
  const body = await req.json();

  const direction: MessageDirection = VALID_DIRECTIONS.includes(body.direction) ? body.direction : "inbound";
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) return NextResponse.json({ error: "body is required" }, { status: 400 });

  const { data: msg, error } = await supabase
    .from("inbox_messages")
    .insert({ conversation_id: id, direction, body: text, sender_name: body.sender_name ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const snippet = text.length > 120 ? text.slice(0, 120) + "…" : text;

  if (direction === "outbound") {
    await supabase.from("inbox_conversations").update({
      latest_message:    snippet,
      latest_message_at: new Date().toISOString(),
      is_read:           true,
      status:            "replied" as InboxStatus,
    }).eq("id", id);
  } else {
    const { data: conv } = await supabase
      .from("inbox_conversations").select("status").eq("id", id).single();
    const newStatus: InboxStatus = conv?.status === "replied" ? "open" : (conv?.status ?? "open") as InboxStatus;
    await supabase.from("inbox_conversations").update({
      latest_message:    snippet,
      latest_message_at: new Date().toISOString(),
      is_read:           false,
      status:            newStatus,
    }).eq("id", id);
  }

  return NextResponse.json(msg, { status: 201 });
}
