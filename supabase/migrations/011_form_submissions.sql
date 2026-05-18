-- ── 011: Public form submissions ──────────────────────────────────────────

create type form_type as enum (
  'landlord',
  'investor',
  'maintenance',
  'website_app',
  'ai_automation'
);

create type form_status as enum (
  'new',
  'reviewed',
  'contacted',
  'qualified',
  'closed'
);

create table if not exists form_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  form_type   form_type   not null,
  contact_id  uuid references contacts(id) on delete set null,
  data        jsonb not null default '{}',
  status      form_status not null default 'new',
  notes       text,
  assigned_to uuid references profiles(id) on delete set null
);

create index form_submissions_form_type_idx  on form_submissions(form_type);
create index form_submissions_contact_id_idx on form_submissions(contact_id);
create index form_submissions_status_idx     on form_submissions(status);
create index form_submissions_created_at_idx on form_submissions(created_at desc);

-- RLS: only authenticated users can read/update submissions
alter table form_submissions enable row level security;

create policy "authenticated read form_submissions"
  on form_submissions for select
  using (auth.uid() is not null);

create policy "authenticated update form_submissions"
  on form_submissions for update
  using (auth.uid() is not null);

-- Inserts come via the service-role key (public forms bypass RLS)
-- No insert policy here — service role bypasses RLS entirely.
