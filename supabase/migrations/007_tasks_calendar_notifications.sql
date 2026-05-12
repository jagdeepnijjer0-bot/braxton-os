-- 007_tasks_calendar_notifications.sql
-- Tasks, Calendar Events, and Notifications tables

-- ── tasks ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  title                   text NOT NULL,
  description             text,
  status                  text NOT NULL DEFAULT 'todo'
                            CHECK (status IN ('todo','in_progress','completed','overdue','cancelled')),
  priority                text NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low','medium','high','urgent')),
  task_type               text NOT NULL DEFAULT 'admin'
                            CHECK (task_type IN ('call','follow_up','meeting','refurb','finance','outreach','admin')),
  due_date                date,
  completed_at            timestamptz,
  assigned_to             uuid REFERENCES users(id) ON DELETE SET NULL,
  linked_contact_id       uuid REFERENCES contacts(id) ON DELETE SET NULL,
  linked_deal_id          uuid REFERENCES deals(id) ON DELETE SET NULL,
  linked_project_id       uuid REFERENCES projects(id) ON DELETE SET NULL,
  linked_conversation_id  uuid REFERENCES inbox_conversations(id) ON DELETE SET NULL
);

-- ── calendar_events ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  title               text NOT NULL,
  description         text,
  event_type          text NOT NULL DEFAULT 'other'
                        CHECK (event_type IN ('meeting','reminder','deadline','milestone','refurb','finance','other')),
  start_datetime      timestamptz NOT NULL,
  end_datetime        timestamptz,
  all_day             boolean NOT NULL DEFAULT false,
  color               text,
  linked_task_id      uuid REFERENCES tasks(id) ON DELETE SET NULL,
  linked_deal_id      uuid REFERENCES deals(id) ON DELETE SET NULL,
  linked_project_id   uuid REFERENCES projects(id) ON DELETE SET NULL,
  linked_contact_id   uuid REFERENCES contacts(id) ON DELETE SET NULL,
  google_event_id     text  -- reserved for future Google Calendar sync
);

-- ── notifications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  title               text NOT NULL,
  body                text,
  type                text NOT NULL DEFAULT 'system'
                        CHECK (type IN ('task_overdue','follow_up_overdue','finance_overdue',
                                        'meeting_upcoming','project_deadline','budget_warning','system')),
  priority            text NOT NULL DEFAULT 'normal'
                        CHECK (priority IN ('low','normal','high','urgent')),
  is_read             boolean NOT NULL DEFAULT false,
  link_url            text,
  linked_entity_type  text,
  linked_entity_id    uuid,
  source_key          text UNIQUE  -- prevents duplicate auto-generated alerts
);

-- ── updated_at triggers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_calendar_updated_at ON calendar_events;
CREATE TRIGGER trg_calendar_updated_at
  BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── auto-complete timestamp trigger ───────────────────────────
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_completed_at ON tasks;
CREATE TRIGGER trg_task_completed_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_open_tasks"           ON tasks;
DROP POLICY IF EXISTS "dev_open_calendar_events" ON calendar_events;
DROP POLICY IF EXISTS "dev_open_notifications"   ON notifications;

CREATE POLICY "dev_open_tasks"           ON tasks           FOR ALL USING (true);
CREATE POLICY "dev_open_calendar_events" ON calendar_events FOR ALL USING (true);
CREATE POLICY "dev_open_notifications"   ON notifications   FOR ALL USING (true);
