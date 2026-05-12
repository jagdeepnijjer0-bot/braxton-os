-- 006_inbox.sql
-- Unified Inbox — conversations, messages, RLS, triggers

-- ── inbox_conversations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbox_conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  contact_id          uuid REFERENCES contacts(id) ON DELETE SET NULL,
  platform            text NOT NULL DEFAULT 'email'
                        CHECK (platform IN ('email','whatsapp','instagram','facebook','linkedin','website_form')),
  subject             text,
  latest_message      text,
  latest_message_at   timestamptz DEFAULT now(),
  status              text NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open','replied','waiting','follow_up','closed')),
  assigned_category   text,
  ai_suggested_reply  text,
  next_action         text,
  priority            text NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to         uuid REFERENCES users(id) ON DELETE SET NULL,
  is_read             boolean NOT NULL DEFAULT false,
  contact_name        text,   -- denormalised for fast display without join
  contact_email       text
);

-- ── inbox_messages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbox_messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES inbox_conversations(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  direction         text NOT NULL DEFAULT 'inbound'
                      CHECK (direction IN ('inbound','outbound')),
  body              text NOT NULL,
  sender_name       text,
  is_read           boolean NOT NULL DEFAULT false
);

-- ── updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_inbox_conv_updated_at ON inbox_conversations;
CREATE TRIGGER trg_inbox_conv_updated_at
  BEFORE UPDATE ON inbox_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE inbox_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_open_inbox_conversations" ON inbox_conversations;
CREATE POLICY "dev_open_inbox_conversations" ON inbox_conversations FOR ALL USING (true);

DROP POLICY IF EXISTS "dev_open_inbox_messages" ON inbox_messages;
CREATE POLICY "dev_open_inbox_messages" ON inbox_messages FOR ALL USING (true);
