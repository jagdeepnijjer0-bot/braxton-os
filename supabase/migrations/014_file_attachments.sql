-- ── 014: File Attachments & Storage ─────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS throughout)
--
-- Before running this migration, create the storage bucket:
--   Dashboard → Storage → New bucket → name: "attachments", Public: OFF
-- Or via SQL (below).

-- ── 1. Storage bucket ─────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  52428800,   -- 50 MB per file
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','text/csv',
    'audio/mpeg','audio/mp4','audio/wav','audio/ogg',
    'video/mp4','video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Storage RLS policies ───────────────────────────────────────────────────
DO $$
BEGIN
  -- Upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'attachments_upload'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "attachments_upload" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'attachments')
    $pol$;
  END IF;

  -- Download / list
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'attachments_read'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "attachments_read" ON storage.objects
        FOR SELECT TO authenticated
        USING (bucket_id = 'attachments')
    $pol$;
  END IF;

  -- Delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'attachments_delete'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "attachments_delete" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'attachments')
    $pol$;
  END IF;
END $$;

-- ── 3. file_attachments metadata table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_attachments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Which entity this file belongs to
  entity_type  text        NOT NULL
                CHECK (entity_type IN ('contact','deal','project','conversation','task','inbox_message')),
  entity_id    text        NOT NULL,          -- UUID as text for flexibility

  -- Storage reference
  storage_path text        NOT NULL UNIQUE,   -- full object path inside the bucket
  bucket       text        NOT NULL DEFAULT 'attachments',

  -- File metadata
  filename     text        NOT NULL,
  file_size    bigint      NOT NULL CHECK (file_size > 0),
  mime_type    text        NOT NULL,

  -- Optional user-provided label / note
  label        text,

  -- Audit
  uploaded_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS file_attachments_entity_idx
  ON file_attachments (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS file_attachments_created_idx
  ON file_attachments (created_at DESC);

-- ── 4. Row-level security ─────────────────────────────────────────────────────
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_attachments_select" ON file_attachments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "file_attachments_insert" ON file_attachments
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "file_attachments_delete" ON file_attachments
  FOR DELETE TO authenticated USING (true);
