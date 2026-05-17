-- ── Phase 2A: Authentication & Team Accounts ─────────────────────────────────
-- Run AFTER all previous migrations (002–009).
-- Supabase Dashboard → SQL Editor → paste and run.

-- ── profiles: one row per auth.users ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
  job_title   TEXT,
  phone       TEXT
);

-- ── teams: workspace/client accounts (foundation for multi-tenancy) ───────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── team_members: user ↔ team with role ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ── Trigger: auto-create profile on signup ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RLS for new tables ────────────────────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Any auth user can read all profiles (for team member lists)
DROP POLICY IF EXISTS "profiles_read"   ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "teams_auth"        ON teams;
DROP POLICY IF EXISTS "team_members_auth" ON team_members;
CREATE POLICY "teams_auth"        ON teams        FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "team_members_auth" ON team_members FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ── Drop all existing "dev_*" and "allow all *" open policies ─────────────────
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE 'dev_%' OR policyname LIKE 'allow all %')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ── Add auth-required policies on all existing data tables ───────────────────
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'contacts', 'contact_activities',
    'deals', 'deal_activities',
    'projects', 'project_activities', 'project_costs',
    'finance_transactions',
    'inbox_conversations', 'inbox_messages',
    'tasks', 'calendar_events', 'notifications',
    'outreach_campaigns', 'outreach_leads', 'outreach_activities',
    'qualification_sessions'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "auth_required_%s" ON public.%I FOR ALL '
      'USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- qualification_templates: any auth user can read; only admins can write
DROP POLICY IF EXISTS "auth_required_qualification_templates" ON qualification_templates;
CREATE POLICY "qual_tpl_read"   ON qualification_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "qual_tpl_write"  ON qualification_templates FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "qual_tpl_update" ON qualification_templates FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "qual_tpl_delete" ON qualification_templates FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── Add profiles + teams + team_members to the existing types ─────────────────
-- (No SQL needed — types are managed in lib/supabase/types.ts)

-- ── HOW TO CREATE YOUR FIRST ADMIN USER ──────────────────────────────────────
-- 1. Go to Supabase Dashboard → Authentication → Users → "Add User"
-- 2. Enter your email + password
-- 3. After creating, run this SQL (replace the email):
--
--    UPDATE profiles SET role = 'admin' WHERE email = 'you@example.com';
--
-- 4. Log in at http://localhost:3000/login
-- ─────────────────────────────────────────────────────────────────────────────
