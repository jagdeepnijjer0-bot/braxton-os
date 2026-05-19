-- Migration 017: Event system — webhook delivery logs + automation logs

-- ── webhook_delivery_logs ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webhook_delivery_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  event            text NOT NULL,
  url              text NOT NULL,
  status           text NOT NULL CHECK (status IN ('pending','success','failed','retrying')),
  attempts         int  NOT NULL DEFAULT 0,
  http_status      int,
  error_message    text,
  request_body     jsonb,
  response_ms      int,
  last_attempt_at  timestamptz
);

CREATE INDEX IF NOT EXISTS webhook_delivery_logs_status_created
  ON public.webhook_delivery_logs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS webhook_delivery_logs_event_created
  ON public.webhook_delivery_logs (event, created_at DESC);

CREATE INDEX IF NOT EXISTS webhook_delivery_logs_created
  ON public.webhook_delivery_logs (created_at DESC);

ALTER TABLE public.webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Admin/manager can read; service role (bypasses RLS) writes
CREATE POLICY "webhook_delivery_logs_select" ON public.webhook_delivery_logs
  FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));

-- ── automation_logs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  event_name     text NOT NULL,
  entity_type    text,
  entity_id      text,
  source         text NOT NULL DEFAULT 'braxton-os',
  triggered_by   text,
  payload        jsonb,
  webhooks_fired int  NOT NULL DEFAULT 0,
  status         text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','partial','failed')),
  error_message  text
);

CREATE INDEX IF NOT EXISTS automation_logs_event_created
  ON public.automation_logs (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS automation_logs_entity
  ON public.automation_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS automation_logs_created
  ON public.automation_logs (created_at DESC);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Admin/manager can read; service role (bypasses RLS) writes
CREATE POLICY "automation_logs_select" ON public.automation_logs
  FOR SELECT
  USING (public.current_user_role() IN ('admin', 'manager'));
