-- 025: Per-entity storage buckets + demo-assets
-- Safe to re-run (ON CONFLICT DO NOTHING throughout)

-- ── 1. Create entity-specific buckets ────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('crm-files', 'crm-files', false, 52428800,
   ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
         'application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain','text/csv',
         'audio/mpeg','audio/mp4','audio/wav','audio/ogg',
         'video/mp4','video/quicktime']),
  ('deal-files', 'deal-files', false, 52428800,
   ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
         'application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain','text/csv',
         'audio/mpeg','audio/mp4','audio/wav','audio/ogg',
         'video/mp4','video/quicktime']),
  ('project-files', 'project-files', false, 52428800,
   ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
         'application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain','text/csv',
         'audio/mpeg','audio/mp4','audio/wav','audio/ogg',
         'video/mp4','video/quicktime']),
  ('message-files', 'message-files', false, 52428800,
   ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
         'application/pdf','application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
         'application/vnd.ms-excel',
         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
         'application/vnd.ms-powerpoint',
         'application/vnd.openxmlformats-officedocument.presentationml.presentation',
         'text/plain','text/csv',
         'audio/mpeg','audio/mp4','audio/wav','audio/ogg',
         'video/mp4','video/quicktime']),
  ('demo-assets', 'demo-assets', false, 10485760,
   ARRAY['image/jpeg','image/png','image/gif','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- ── 2. RLS policies for each new bucket ──────────────────────────────────────

DO $$
DECLARE
  buckets text[] := ARRAY['crm-files','deal-files','project-files','message-files','demo-assets'];
  b text;
  pol_name text;
BEGIN
  FOREACH b IN ARRAY buckets LOOP
    -- Upload
    pol_name := b || '_upload';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = pol_name
    ) THEN
      EXECUTE format(
        $pol$CREATE POLICY %I ON storage.objects
          FOR INSERT TO authenticated
          WITH CHECK (bucket_id = %L)$pol$,
        pol_name, b
      );
    END IF;

    -- Read
    pol_name := b || '_read';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = pol_name
    ) THEN
      EXECUTE format(
        $pol$CREATE POLICY %I ON storage.objects
          FOR SELECT TO authenticated
          USING (bucket_id = %L)$pol$,
        pol_name, b
      );
    END IF;

    -- Delete
    pol_name := b || '_delete';
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = pol_name
    ) THEN
      EXECUTE format(
        $pol$CREATE POLICY %I ON storage.objects
          FOR DELETE TO authenticated
          USING (bucket_id = %L)$pol$,
        pol_name, b
      );
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
