import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import type { FileEntityType } from "@/lib/storage/config";

// GET /api/attachments?entity_type=contact&entity_id=xxx
export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entity_type") as FileEntityType | null;
  const entityId   = searchParams.get("entity_id");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "entity_type and entity_id are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("file_attachments")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ attachments: data ?? [] });
}

// POST /api/attachments — save metadata after a successful upload
export async function POST(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { entity_type, entity_id, storage_path, filename, file_size, mime_type, label } = body;

  if (!entity_type || !entity_id || !storage_path || !filename || !file_size || !mime_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("file_attachments")
    .insert({
      entity_type,
      entity_id,
      storage_path,
      filename,
      file_size,
      mime_type,
      label:       label ?? null,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void logAudit({
    userId:     user.id,
    action:     "upload",
    entityType: "file",
    entityId:   data.id,
    metadata:   { entity_type, entity_id, filename, file_size, mime_type },
  });

  return NextResponse.json({ ok: true, attachment: data });
}
