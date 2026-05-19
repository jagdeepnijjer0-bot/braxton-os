import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { deleteStorageObject } from "@/lib/storage/server";

// DELETE /api/attachments/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Fetch metadata first to get storage_path
  const { data: attachment, error: fetchError } = await supabase
    .from("file_attachments")
    .select("id, storage_path, uploaded_by")
    .eq("id", id)
    .single();

  if (fetchError || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  // Delete from storage
  try {
    await deleteStorageObject(attachment.storage_path);
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
  return NextResponse.json({ ok: true });
}
