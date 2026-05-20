-- ============================================================
-- Migration 022: Drop unexpected NOT NULL constraints
--
-- The live database was created from a schema that differs from
-- the migration files. Two tables have NOT NULL constraints on
-- columns the application code does not always provide:
--
--   contacts.first_name  — app inserts only use `name`; first_name
--                          is populated only by Meta/social imports
--   outreach_campaigns.name — live table uses `name` but app code
--                          uses `campaign_name`; copy existing data
--                          across and drop the NOT NULL
-- ============================================================

-- ── contacts: drop NOT NULL on first_name ─────────────────────────────────
-- first_name is optional — only set by Meta/social integrations.
-- The primary display-name field is `name` (always provided by forms).
ALTER TABLE public.contacts ALTER COLUMN first_name DROP NOT NULL;

-- ── contacts: drop NOT NULL on last_name if it exists ─────────────────────
-- Guard with DO block in case some live schemas also set this NOT NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'contacts'
      AND column_name  = 'last_name'
      AND is_nullable  = 'NO'
  ) THEN
    ALTER TABLE public.contacts ALTER COLUMN last_name DROP NOT NULL;
  END IF;
END;
$$;

-- ── outreach_campaigns: reconcile `name` vs `campaign_name` ──────────────
-- The live table has a `name` column (NOT NULL) from an older schema.
-- Migration 008 defined it as `campaign_name`. Application code uses
-- `campaign_name` throughout.
--
-- Step 1: ensure campaign_name exists (no-op if migration 021 already ran)
ALTER TABLE public.outreach_campaigns ADD COLUMN IF NOT EXISTS campaign_name text;

-- Step 2: backfill campaign_name from name for any existing rows
UPDATE public.outreach_campaigns
   SET campaign_name = name
 WHERE campaign_name IS NULL AND name IS NOT NULL;

-- Step 3: drop NOT NULL on the legacy `name` column so new inserts that only
-- provide campaign_name do not fail
ALTER TABLE public.outreach_campaigns ALTER COLUMN name DROP NOT NULL;

-- ── Catch-all: drop NOT NULL on any other text columns in contacts that the
-- form insert path does not populate ─────────────────────────────────────────
-- role, source, notes are all optional in the app but may be NOT NULL on live.
DO $$
DECLARE
  col text;
BEGIN
  FOR col IN
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'contacts'
      AND column_name  IN ('role', 'source', 'notes', 'company', 'phone', 'email',
                           'follow_up_date', 'last_contacted', 'lead_type')
      AND is_nullable  = 'NO'
      AND column_default IS NULL
  LOOP
    EXECUTE format('ALTER TABLE public.contacts ALTER COLUMN %I DROP NOT NULL', col);
  END LOOP;
END;
$$;

-- ── Notify PostgREST to reload its schema cache ───────────────────────────
NOTIFY pgrst, 'reload schema';
