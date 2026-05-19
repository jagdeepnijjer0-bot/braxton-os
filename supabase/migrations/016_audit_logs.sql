-- ── 016: Audit Logs ───────────────────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS throughout)
--
-- Creates an append-only audit log that records who did what to which entity.
-- Written by the service role (bypasses RLS) via lib/audit.ts.
-- UI readable by admins and managers only.

-- ── 1. Table ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),

  -- Who
  user_id      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,

  -- What
  action       text        NOT NULL
                CHECK (action IN (
                  'create', 'update', 'delete',
                  'upload', 'download',
                  'status_change', 'login', 'logout'
                )),

  -- Which entity
  entity_type  text        NOT NULL,
  entity_id    text        NOT NULL,

  -- Field-level diff: { "field": ["old_value", "new_value"] }
  changes      jsonb,

  -- Extra context (ip, user_agent, etc.)
  metadata     jsonb
);

-- ── 2. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
  ON audit_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_user_idx
  ON audit_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx
  ON audit_logs (created_at DESC);

-- ── 3. Row-level security ─────────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and managers can read audit logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('admin', 'manager'));

-- No direct INSERT/UPDATE/DELETE for non-service-role users
-- The service-role client (lib/audit.ts) bypasses RLS to write logs
-- This prevents users from tampering with their own audit trail
