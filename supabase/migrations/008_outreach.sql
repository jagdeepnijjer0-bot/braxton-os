-- 008_outreach.sql
-- Outreach Tracker: campaigns, leads, activity timeline

-- ── outreach_campaigns ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  campaign_name   text NOT NULL,
  niche           text NOT NULL DEFAULT 'letting_agents'
                    CHECK (niche IN (
                      'letting_agents','property_sourcers','developers',
                      'sa_operators','estate_agents','maintenance',
                      'ai_automation','website_app'
                    )),
  offer           text,
  platform        text NOT NULL DEFAULT 'email'
                    CHECK (platform IN ('linkedin','email','whatsapp','facebook','instagram')),
  status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','paused','completed','archived')),
  target_count    integer NOT NULL DEFAULT 0,
  description     text,
  notes           text,
  assigned_user   uuid REFERENCES users(id) ON DELETE SET NULL
);

-- ── outreach_leads ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  campaign_id         uuid NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  contact_name        text NOT NULL,
  company             text,
  email               text,
  phone               text,
  platform            text NOT NULL DEFAULT 'email'
                        CHECK (platform IN ('linkedin','email','whatsapp','facebook','instagram')),
  lead_source         text,
  status              text NOT NULL DEFAULT 'new'
                        CHECK (status IN (
                          'new','contacted','replied','interested',
                          'not_interested','booked','closed','ghosted','unqualified'
                        )),
  step                integer NOT NULL DEFAULT 1,
  reply_status        text NOT NULL DEFAULT 'no_reply'
                        CHECK (reply_status IN (
                          'no_reply','replied','positive','negative','bounced','out_of_office'
                        )),
  booked_call         boolean NOT NULL DEFAULT false,
  booked_call_at      timestamptz,
  closed_deal         boolean NOT NULL DEFAULT false,
  closed_at           timestamptz,
  linked_contact_id   uuid REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_user       uuid REFERENCES users(id) ON DELETE SET NULL,
  notes               text,
  next_follow_up      date,
  last_contacted_at   timestamptz
);

-- ── outreach_activities ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_activities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  lead_id       uuid NOT NULL REFERENCES outreach_leads(id) ON DELETE CASCADE,
  campaign_id   uuid NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'note'
                  CHECK (activity_type IN (
                    'note','email_sent','dm_sent','call',
                    'reply_received','status_change','follow_up_set',
                    'deal_closed','call_booked'
                  )),
  body          text,
  created_by    text
);

-- ── updated_at triggers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_outreach_campaigns_updated_at ON outreach_campaigns;
CREATE TRIGGER trg_outreach_campaigns_updated_at
  BEFORE UPDATE ON outreach_campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_outreach_leads_updated_at ON outreach_leads;
CREATE TRIGGER trg_outreach_leads_updated_at
  BEFORE UPDATE ON outreach_leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── auto-timestamps on booked/closed ──────────────────────────
CREATE OR REPLACE FUNCTION set_lead_timestamps()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booked_call = true AND (OLD.booked_call = false OR OLD.booked_call IS NULL) THEN
    NEW.booked_call_at = now();
  END IF;
  IF NEW.closed_deal = true AND (OLD.closed_deal = false OR OLD.closed_deal IS NULL) THEN
    NEW.closed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_timestamps ON outreach_leads;
CREATE TRIGGER trg_lead_timestamps
  BEFORE UPDATE ON outreach_leads FOR EACH ROW EXECUTE FUNCTION set_lead_timestamps();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_leads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_open_outreach_campaigns"  ON outreach_campaigns;
DROP POLICY IF EXISTS "dev_open_outreach_leads"      ON outreach_leads;
DROP POLICY IF EXISTS "dev_open_outreach_activities" ON outreach_activities;

CREATE POLICY "dev_open_outreach_campaigns"  ON outreach_campaigns  FOR ALL USING (true);
CREATE POLICY "dev_open_outreach_leads"      ON outreach_leads      FOR ALL USING (true);
CREATE POLICY "dev_open_outreach_activities" ON outreach_activities FOR ALL USING (true);

-- ── useful indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_outreach_leads_campaign_id ON outreach_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_status      ON outreach_leads(status);
CREATE INDEX IF NOT EXISTS idx_outreach_leads_follow_up   ON outreach_leads(next_follow_up);
CREATE INDEX IF NOT EXISTS idx_outreach_activities_lead   ON outreach_activities(lead_id);
