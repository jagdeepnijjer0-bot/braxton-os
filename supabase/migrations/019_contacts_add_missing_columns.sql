-- ============================================================
-- Migration 019: Add missing columns to contacts table
--
-- The TypeScript types and several API routes reference columns
-- that were not present in the initial migration 002 schema.
-- This migration adds them safely with ADD COLUMN IF NOT EXISTS.
--
-- Also expands the status CHECK constraint to include 'lead',
-- which is a valid ContactStatus in the TypeScript types but was
-- omitted from the original CHECK in migration 002.
-- ============================================================

-- The column causing the reported "schema cache" error in forms
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company      text;

-- Split-name fields used by Meta/social integrations and types.ts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_name   text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_name    text;

-- Relationship fields present in types.ts
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id   uuid;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS owner_id     uuid
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── Expand status CHECK to include 'lead' ──────────────────────────────────
-- Find and drop the existing status check constraint (auto-named by Postgres)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = 'public.contacts'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%in%'
    LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.contacts DROP CONSTRAINT %I', cname);
  END IF;
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
