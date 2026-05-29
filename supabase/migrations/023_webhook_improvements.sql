-- ============================================================
-- Migration 023: Webhook delivery improvements
--
-- 1. Add response_body to webhook_delivery_logs so failed
--    delivery details (n8n error messages) are captured.
-- 2. Add url_mode to n8n_settings to control URL generation:
--      'append_event' — base_url + '/' + event_name  (default)
--      'fixed'        — base_url used as-is for every event
-- ============================================================

-- ── webhook_delivery_logs: capture response body ──────────────────────────────
ALTER TABLE public.webhook_delivery_logs
  ADD COLUMN IF NOT EXISTS response_body text;

-- ── n8n_settings: url_mode column ────────────────────────────────────────────
ALTER TABLE public.n8n_settings
  ADD COLUMN IF NOT EXISTS url_mode text NOT NULL DEFAULT 'append_event';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.n8n_settings'::regclass
      AND conname   = 'n8n_settings_url_mode_check'
  ) THEN
    ALTER TABLE public.n8n_settings
      ADD CONSTRAINT n8n_settings_url_mode_check
      CHECK (url_mode IN ('append_event', 'fixed'));
  END IF;
END;
$$;

-- ── Notify PostgREST to reload schema cache ───────────────────────────────────
NOTIFY pgrst, 'reload schema';
