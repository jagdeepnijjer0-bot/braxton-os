-- ── 013: AI + Automation Layer ────────────────────────────────────────────────
-- Run in: Supabase Dashboard → SQL Editor
-- Safe to re-run (all statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)

-- ── 1. AI scoring + summary fields on contacts ────────────────────────────────
ALTER TABLE contacts
  ADD COLUMN IF NOT EXISTS ai_score       integer CHECK (ai_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS ai_score_label text    CHECK (ai_score_label IN ('hot','warm','cold')),
  ADD COLUMN IF NOT EXISTS ai_summary     text,
  ADD COLUMN IF NOT EXISTS ai_scored_at   timestamptz;

-- ── 2. AI summary on inbox_conversations ──────────────────────────────────────
ALTER TABLE inbox_conversations
  ADD COLUMN IF NOT EXISTS ai_summary text;

-- ── 3. AI summary on form_submissions ─────────────────────────────────────────
ALTER TABLE form_submissions
  ADD COLUMN IF NOT EXISTS ai_summary text;

-- ── 4. workflow_events — automation event log ─────────────────────────────────
--   Stores all inbound/outbound automation events so future integrations
--   (Gmail, WhatsApp, n8n) can plug in by writing rows here.
CREATE TABLE IF NOT EXISTS workflow_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  event_type   text        NOT NULL,                         -- e.g. "contact.created", "inbox.message.received"
  source       text        NOT NULL,                         -- e.g. "meta_webhook", "form_submit", "ai_engine"
  entity_type  text        NOT NULL,                         -- "contact" | "conversation" | "form_submission" | "task" | "deal"
  entity_id    text        NOT NULL,                         -- uuid of the entity
  payload      jsonb       NOT NULL DEFAULT '{}',
  processed_at timestamptz,
  result       jsonb
);

ALTER TABLE workflow_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_events_select" ON workflow_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "workflow_events_insert" ON workflow_events
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS workflow_events_entity_idx
  ON workflow_events (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS workflow_events_type_created_idx
  ON workflow_events (event_type, created_at DESC);

-- ── 5. Index to support hot-lead queries ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS contacts_ai_score_label_idx
  ON contacts (ai_score_label)
  WHERE ai_score_label IS NOT NULL;
