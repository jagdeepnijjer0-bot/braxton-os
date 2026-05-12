-- 004_projects.sql
-- Project / Refurb Tracker — tables, RLS, auto-log triggers

-- ── Project stage enum ──────────────────────────────────────
-- We use a text column constrained by CHECK for flexibility

-- ── projects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  project_name          text NOT NULL,
  linked_deal_id        uuid REFERENCES deals(id) ON DELETE SET NULL,
  contractor_name       text,
  stage                 text NOT NULL DEFAULT 'planning'
                          CHECK (stage IN ('planning','demolition','first_fix','second_fix','decorating','snagging','completed','on_hold')),
  budget                numeric(12,2),
  amount_spent          numeric(12,2) DEFAULT 0,
  projected_profit      numeric(12,2),
  progress_percentage   integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  start_date            date,
  target_completion_date date,
  notes                 text,
  assigned_to           uuid REFERENCES users(id) ON DELETE SET NULL
);

-- ── project_activities ────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  type        text NOT NULL DEFAULT 'note'
                CHECK (type IN ('note','call','email','meeting','stage_change','cost_update','created','photo')),
  body        text NOT NULL,
  metadata    jsonb,
  created_by  uuid REFERENCES users(id) ON DELETE SET NULL
);

-- ── project_costs ─────────────────────────────────────────
-- Individual spend line items (money in / money out)
CREATE TABLE IF NOT EXISTS project_costs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  label       text NOT NULL,
  amount      numeric(12,2) NOT NULL,
  direction   text NOT NULL DEFAULT 'out' CHECK (direction IN ('in','out')),
  category    text,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  notes       text
);

-- ── updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── auto-log: created ─────────────────────────────────────
CREATE OR REPLACE FUNCTION log_project_created()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO project_activities (project_id, type, body)
  VALUES (NEW.id, 'created', 'Project created: ' || NEW.project_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_project_created ON projects;
CREATE TRIGGER trg_log_project_created
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION log_project_created();

-- ── auto-log: stage change ────────────────────────────────
CREATE OR REPLACE FUNCTION log_project_stage_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO project_activities (project_id, type, body)
    VALUES (NEW.id, 'stage_change',
      'Stage moved from ' || OLD.stage || ' → ' || NEW.stage);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_project_stage_change ON projects;
CREATE TRIGGER trg_log_project_stage_change
  AFTER UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION log_project_stage_change();

-- ── RLS ───────────────────────────────────────────────────
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_costs     ENABLE ROW LEVEL SECURITY;

-- Dev open policy (replace with auth.uid() checks in production)
DROP POLICY IF EXISTS "dev_open_projects" ON projects;
CREATE POLICY "dev_open_projects" ON projects FOR ALL USING (true);

DROP POLICY IF EXISTS "dev_open_project_activities" ON project_activities;
CREATE POLICY "dev_open_project_activities" ON project_activities FOR ALL USING (true);

DROP POLICY IF EXISTS "dev_open_project_costs" ON project_costs;
CREATE POLICY "dev_open_project_costs" ON project_costs FOR ALL USING (true);
