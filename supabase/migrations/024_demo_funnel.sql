-- 024_demo_funnel.sql
-- Demo funnel: sessions, events, prospect tracking

-- ── demo_sessions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token           text NOT NULL UNIQUE,
  contact_id      uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  email           text NOT NULL,
  name            text NOT NULL,
  business_name   text,
  industry        text,
  problem         text,
  engagement_score integer NOT NULL DEFAULT 0,
  last_active_at  timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  package_reserved text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_sessions_token_idx      ON public.demo_sessions(token);
CREATE INDEX IF NOT EXISTS demo_sessions_contact_idx    ON public.demo_sessions(contact_id);
CREATE INDEX IF NOT EXISTS demo_sessions_expires_idx    ON public.demo_sessions(expires_at);

-- ── demo_events ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.demo_sessions(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_events_session_idx ON public.demo_events(session_id);
CREATE INDEX IF NOT EXISTS demo_events_type_idx    ON public.demo_events(event_type);

-- ── Add demo_user to contacts status CHECK ────────────────────────────────────
-- Drop the old constraint if it exists, then recreate with demo_user added
DO $$
BEGIN
  -- Drop existing check constraint on contacts.status if present
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'contacts'
      AND constraint_name = 'contacts_status_check'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.contacts DROP CONSTRAINT contacts_status_check;
  END IF;
END $$;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_status_check CHECK (status IN (
    'lead', 'new', 'contacted', 'qualified', 'proposal_sent',
    'negotiating', 'closed_won', 'closed_lost', 'follow_up', 'demo_user'
  ));

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_events   ENABLE ROW LEVEL SECURITY;

-- Service-role only (admin client bypasses RLS anyway)
-- No public policies — all access via service-role admin client

NOTIFY pgrst, 'reload schema';
