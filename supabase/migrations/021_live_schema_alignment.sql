-- ============================================================
-- Migration 021: Live schema alignment
--
-- Several tables were created from pre-migration schemas and are
-- missing columns that TypeScript types and API routes depend on.
-- All statements use ADD COLUMN IF NOT EXISTS — fully idempotent,
-- safe to re-run, will not affect existing data.
-- ============================================================

-- ── contacts: add name (NOT NULL in schema but may be absent from pre-002 tables) ──
-- Added as nullable here; app-layer validation ensures it is always provided.
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS name text;

-- ── outreach_campaigns: all columns from migration 008 ────────────────────────
-- migration 008 may not have been applied to the live database.
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS campaign_name  text;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS niche          text;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS offer          text;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS platform       text;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS target_count   integer NOT NULL DEFAULT 0;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS description    text;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS notes          text;
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS assigned_user  uuid;

-- Ensure outreach_campaigns.status exists with a safe default
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS status         text NOT NULL DEFAULT 'draft';

-- ── outreach_campaigns: CHECK constraints (drop & recreate idempotently) ────
DO $$
DECLARE cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.outreach_campaigns'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%niche%'
  LOOP
    EXECUTE format('ALTER TABLE public.outreach_campaigns DROP CONSTRAINT %I', cname);
  END LOOP;
END;
$$;
ALTER TABLE public.outreach_campaigns ADD CONSTRAINT outreach_campaigns_niche_check CHECK (
  niche IS NULL OR niche IN (
    'letting_agents','property_sourcers','developers','sa_operators',
    'estate_agents','maintenance','ai_automation','website_app'
  )
);

DO $$
DECLARE cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.outreach_campaigns'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%platform%'
  LOOP
    EXECUTE format('ALTER TABLE public.outreach_campaigns DROP CONSTRAINT %I', cname);
  END LOOP;
END;
$$;
ALTER TABLE public.outreach_campaigns ADD CONSTRAINT outreach_campaigns_platform_check CHECK (
  platform IS NULL OR platform IN ('linkedin','email','whatsapp','facebook','instagram')
);

DO $$
DECLARE cname text;
BEGIN
  FOR cname IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.outreach_campaigns'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.outreach_campaigns DROP CONSTRAINT %I', cname);
  END LOOP;
END;
$$;
ALTER TABLE public.outreach_campaigns ADD CONSTRAINT outreach_campaigns_status_check CHECK (
  status IN ('draft','active','paused','completed','archived')
);

-- ── outreach_leads: all columns from migration 008 ────────────────────────────
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS campaign_id        uuid;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS contact_name       text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS company            text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS email              text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS phone              text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS platform           text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS lead_source        text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS step               integer NOT NULL DEFAULT 1;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS reply_status       text NOT NULL DEFAULT 'no_reply';
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS booked_call        boolean NOT NULL DEFAULT false;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS booked_call_at     timestamptz;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS closed_deal        boolean NOT NULL DEFAULT false;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS closed_at          timestamptz;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS linked_contact_id  uuid;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS assigned_user      uuid;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS notes              text;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS next_follow_up     date;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS last_contacted_at  timestamptz;
ALTER TABLE public.outreach_leads ADD COLUMN IF NOT EXISTS status             text NOT NULL DEFAULT 'new';

-- ── inbox_conversations: columns used by Meta integration and AI layer ────────
ALTER TABLE public.inbox_conversations ADD COLUMN IF NOT EXISTS ai_summary        text;
ALTER TABLE public.inbox_conversations ADD COLUMN IF NOT EXISTS external_thread_id text;

-- Unique index for Meta dedup (safe — IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS inbox_conversations_external_thread_id_idx
  ON public.inbox_conversations(external_thread_id)
  WHERE external_thread_id IS NOT NULL;

-- ── inbox_messages: column used by Meta integration for dedup ─────────────────
ALTER TABLE public.inbox_messages ADD COLUMN IF NOT EXISTS external_message_id text;

CREATE UNIQUE INDEX IF NOT EXISTS inbox_messages_external_message_id_idx
  ON public.inbox_messages(external_message_id)
  WHERE external_message_id IS NOT NULL;

-- ── form_submissions: ai_summary column used by AI summary layer ──────────────
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS ai_summary text;

-- ── Indexes for new columns ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS outreach_campaigns_campaign_name_idx
  ON public.outreach_campaigns(campaign_name);

CREATE INDEX IF NOT EXISTS outreach_campaigns_status_idx
  ON public.outreach_campaigns(status);

-- ── Notify PostgREST to reload its schema cache ───────────────────────────────
NOTIFY pgrst, 'reload schema';
