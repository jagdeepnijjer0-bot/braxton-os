import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createSignedDownloadUrl } from "@/lib/storage/server";

// GET /api/attachments/:id/download → redirects to signed download URL (1h TTL)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { data: attachment, error } = await supabase
    .from("file_attachments")
    .select("storage_path, bucket, filename")
    .eq("id", id)
    .single();

  if (error || !attachment) {
    return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
  }

  try {
    const url = await createSignedDownloadUrl(
      attachment.storage_path,
      attachment.bucket ?? "attachments",
    );
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
