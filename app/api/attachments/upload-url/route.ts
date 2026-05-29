import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createSignedUploadUrl } from "@/lib/storage/server";
import { storagePath, getBucketForEntity, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/storage/config";
import type { FileEntityType } from "@/lib/storage/config";
import { DEMO_COOKIE } from "@/lib/demo/session";

// POST /api/attachments/upload-url
// Body: { entity_type, entity_id, filename, mime_type, file_size }
// Returns: { signedUrl, token, path, bucket }
export async function POST(req: NextRequest) {
  // Block demo users — they have no Supabase auth and must not upload to real buckets
  if (req.cookies.get(DEMO_COOKIE)?.value) {
    return NextResponse.json({ error: "File uploads are not available in the demo." }, { status: 403 });
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { entity_type, entity_id, filename, mime_type, file_size } = body as {
    entity_type: FileEntityType;
    entity_id:   string;
    filename:    string;
    mime_type:   string;
    file_size:   number;
  };

  if (!entity_type || !entity_id || !filename || !mime_type || !file_size) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES[mime_type]) {
    return NextResponse.json({ error: `File type ${mime_type} is not allowed` }, { status: 400 });
  }

  if (file_size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 400 });
  }

  const fileId = crypto.randomUUID();
  const path   = storagePath(entity_type, entity_id, fileId, filename);
  const bucket = getBucketForEntity(entity_type);

  try {
    const result = await createSignedUploadUrl(path, bucket);
    return NextResponse.json({ ok: true, ...result, file_id: fileId, bucket });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
