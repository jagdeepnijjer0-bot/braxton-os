-- ============================================================
-- Migration 020: Full contacts schema repair
--
-- The live contacts table was created from a pre-002 schema
-- and is missing columns that the TypeScript types and API
-- routes depend on. This migration safely adds every missing
-- column using ADD COLUMN IF NOT EXISTS (fully idempotent).
--
-- Safe to run multiple times — all statements are no-ops if
-- the column already exists.
-- ============================================================

-- ── Core identity columns ─────────────────────────────────────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_name      text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_name       text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company         text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id      uuid;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS role            text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email           text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone           text;

-- ── Lead classification ───────────────────────────────────────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_type       text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS source          text;

-- ── Pipeline / scheduling ─────────────────────────────────────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS notes           text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS follow_up_date  date;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_contacted  timestamptz;

-- ── Ownership ─────────────────────────────────────────────────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS assigned_to     uuid;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS owner_id        uuid;

-- ── Ensure status column exists with a default ────────────────────────────
-- (It should exist from the original table, but guard just in case)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status          text NOT NULL DEFAULT 'new';

-- ── Drop and recreate lead_type CHECK constraint ──────────────────────────
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.contacts'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%lead_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.contacts DROP CONSTRAINT %I', cname);
  END LOOP;
END;
$$;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_lead_type_check CHECK (
  lead_type IS NULL OR lead_type IN (
    'letting_agent',
    'sourcer',
    'developer',
    'landlord',
    'investor',
    'maintenance_client',
    'website_app_prospect',
    'ai_automation_prospect'
  )
);

-- ── Drop and recreate status CHECK constraint ─────────────────────────────
-- Includes 'lead' which was missing from the original migration 002 definition
-- and is used by lib/meta/processor.ts inserts.
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.contacts'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.contacts DROP CONSTRAINT %I', cname);
  END LOOP;
END;
$$;

ALTER TABLE public.contacts ADD CONSTRAINT contacts_status_check CHECK (status IN (
  'lead',
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'negotiating',
  'closed_won',
  'closed_lost',
  'follow_up'
));

-- ── Indexes (IF NOT EXISTS requires Postgres 9.5+ — supported on Supabase) ─
CREATE INDEX IF NOT EXISTS contacts_lead_type_idx   ON public.contacts(lead_type);
CREATE INDEX IF NOT EXISTS contacts_status_idx      ON public.contacts(status);
CREATE INDEX IF NOT EXISTS contacts_assigned_to_idx ON public.contacts(assigned_to);
CREATE INDEX IF NOT EXISTS contacts_follow_up_idx   ON public.contacts(follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- ── Notify PostgREST to reload its schema cache ───────────────────────────
NOTIFY pgrst, 'reload schema';
