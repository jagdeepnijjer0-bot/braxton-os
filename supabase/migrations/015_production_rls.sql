-- ── 015: Production RLS Hardening ────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses DROP POLICY IF EXISTS + CREATE)
--
-- Goals:
--   1. Add extended roles to profiles (manager, sales, va, contractor, investor)
--   2. Add UPDATE policies to tables that only had SELECT/INSERT
--   3. Harden file_attachments: DELETE only by uploader or admin
--   4. Harden storage objects: DELETE only by uploader or admin
--   5. Ensure all tables require authentication for writes

-- ── 0. Helper: get current user role ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM profiles WHERE id = auth.uid()),
    'viewer'
  );
$$;

-- ── 1. Extend profiles.role to support new roles ──────────────────────────────
-- Drop old constraint and add new one with expanded role set
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'admin', 'manager', 'sales', 'va', 'member',
    'contractor', 'investor', 'viewer'
  ));

-- ── 2. contacts — add UPDATE policy ───────────────────────────────────────────
DROP POLICY IF EXISTS "contacts_update" ON contacts;
CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 3. deals — add UPDATE policy ──────────────────────────────────────────────
DROP POLICY IF EXISTS "deals_update" ON deals;
CREATE POLICY "deals_update" ON deals
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 4. projects — add UPDATE policy ───────────────────────────────────────────
DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 5. tasks — add UPDATE policy ──────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 6. Harden file_attachments ────────────────────────────────────────────────
-- Allow SELECT for all authenticated users (files are business data)
DROP POLICY IF EXISTS "file_attachments_select" ON file_attachments;
CREATE POLICY "file_attachments_select" ON file_attachments
  FOR SELECT TO authenticated USING (true);

-- Allow INSERT only if uploaded_by matches current user
DROP POLICY IF EXISTS "file_attachments_insert" ON file_attachments;
CREATE POLICY "file_attachments_insert" ON file_attachments
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- DELETE only by original uploader or admin/manager
DROP POLICY IF EXISTS "file_attachments_delete" ON file_attachments;
CREATE POLICY "file_attachments_delete" ON file_attachments
  FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR auth.user_role() IN ('admin', 'manager')
  );

-- ── 7. Harden storage.objects for the attachments bucket ─────────────────────
-- Drop existing permissive delete and replace with owner-aware version
DROP POLICY IF EXISTS "attachments_delete" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'attachments_delete_hardened'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "attachments_delete_hardened" ON storage.objects
        FOR DELETE TO authenticated
        USING (
          bucket_id = 'attachments'
          AND (
            owner = auth.uid()::text
            OR auth.user_role() IN ('admin', 'manager')
          )
        )
    $pol$;
  END IF;
END $$;

-- ── 8. Ensure notifications require auth for INSERT ────────────────────────────
DROP POLICY IF EXISTS "notifications_insert_auth" ON notifications;
CREATE POLICY "notifications_insert_auth" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ── 9. Restrict settings reads to admins/managers ────────────────────────────
-- (no settings table yet — this is a placeholder for future)
-- When a settings table is added, apply: USING (auth.user_role() IN ('admin','manager'))
