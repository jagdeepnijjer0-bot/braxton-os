-- ── 018: n8n Settings ────────────────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (IF NOT EXISTS throughout)
--
-- Stores per-workspace n8n configuration so it can be edited via the UI.
-- Dispatcher reads from this table (with 60s cache) and falls back to env vars.

CREATE TABLE IF NOT EXISTS n8n_settings (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled      boolean     NOT NULL DEFAULT false,
  base_url     text,
  -- per-event config: { "new_contact": { "url": null, "enabled": true }, ... }
  event_config jsonb       NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE n8n_settings ENABLE ROW LEVEL SECURITY;

-- Admin/manager can read
CREATE POLICY "n8n_settings_select" ON n8n_settings
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('admin', 'manager'));

-- Only admin can write
CREATE POLICY "n8n_settings_insert" ON n8n_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "n8n_settings_update" ON n8n_settings
  FOR UPDATE TO authenticated
  USING  (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');
