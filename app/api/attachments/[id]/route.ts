import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { deleteStorageObject } from "@/lib/storage/server";
import { logAudit } from "@/lib/audit";
import { emit } from "@/lib/events/emit";

// DELETE /api/attachments/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Fetch full metadata — need bucket, storage_path, entity context
  const { data: attachment, error: fetchError } = await supabase
    .from("file_attachments")
    .select("id, storage_path, bucket, filename, mime_type, file_size, entity_type, entity_id, uploaded_by")
    .eq("id", id)
    .single();

  if (fetchError || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Delete from the correct bucket
  try {
    await deleteStorageObject(attachment.storage_path, attachment.bucket ?? "attachments");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Storage delete failed: ${message}` }, { status: 500 });
  }

  // Delete metadata row
  const { error: deleteError } = await supabase
    .from("file_attachments")
    .delete()
    .eq("id", id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  void logAudit({
    userId:     user.id,
    action:     "delete",
    entityType: "file",
    entityId:   id,
    metadata:   { storage_path: attachment.storage_path, bucket: attachment.bucket },
  });

  void emit(
    "file.deleted",
    {
      file_id:     id,
      filename:    attachment.filename,
      entity_type: attachment.entity_type,
      entity_id:   attachment.entity_id,
      file_size:   attachment.file_size,
      mime_type:   attachment.mime_type,
      deleted_by:  user.id,
    },
    { entityType: "file", entityId: id, triggeredBy: user.id },
  );

  return NextResponse.json({ ok: true });
}
