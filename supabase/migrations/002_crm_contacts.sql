-- ============================================================
-- Migration 002: CRM Contacts + Activity History
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Drop old contacts table (from schema.sql) and rebuild with full CRM fields
drop table if exists public.notes cascade;
drop table if exists public.outreach_leads cascade;
drop table if exists public.deal_tasks cascade;
drop table if exists public.deals cascade;
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.contacts cascade;
drop table if exists public.contact_activities cascade;

-- ============================================================
-- CONTACTS
-- ============================================================
create table public.contacts (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- Core identity
  name             text not null,
  company          text,
  role             text,
  email            text,
  phone            text,

  -- Lead classification
  lead_type        text check (lead_type in (
                     'letting_agent',
                     'sourcer',
                     'developer',
                     'landlord',
                     'investor',
                     'maintenance_client',
                     'website_app_prospect',
                     'ai_automation_prospect'
                   )),
  source           text,

  -- Pipeline status
  status           text not null default 'new' check (status in (
                     'new',
                     'contacted',
                     'qualified',
                     'proposal_sent',
                     'negotiating',
                     'closed_won',
                     'closed_lost',
                     'follow_up'
                   )),

  -- Notes & scheduling
  notes            text,
  follow_up_date   date,
  last_contacted   timestamptz,

  -- Ownership
  assigned_to      uuid references public.users(id) on delete set null
);

comment on table public.contacts is 'CRM contacts with full lead lifecycle tracking.';

create index contacts_status_idx      on public.contacts(status);
create index contacts_lead_type_idx   on public.contacts(lead_type);
create index contacts_assigned_to_idx on public.contacts(assigned_to);
create index contacts_follow_up_idx   on public.contacts(follow_up_date) where follow_up_date is not null;

-- ============================================================
-- CONTACT ACTIVITIES
-- Append-only history log for every action on a contact
-- ============================================================
create table public.contact_activities (
  id           uuid primary key default gen_random_uuid(),
  contact_id   uuid not null references public.contacts(id) on delete cascade,
  created_at   timestamptz not null default now(),

  type         text not null check (type in (
                 'note',
                 'call',
                 'email',
                 'meeting',
                 'status_change',
                 'follow_up_set',
                 'created'
               )),

  body         text not null,
  metadata     jsonb,           -- e.g. { "from_status": "new", "to_status": "contacted" }
  created_by   uuid references public.users(id) on delete set null
);

comment on table public.contact_activities is 'Immutable activity log for each contact.';

create index contact_activities_contact_id_idx on public.contact_activities(contact_id);
create index contact_activities_created_at_idx on public.contact_activities(created_at desc);

-- ============================================================
-- AUTO-UPDATE updated_at for contacts
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.contacts;
create trigger set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.contacts           enable row level security;
alter table public.contact_activities enable row level security;

-- Dev open policy — tighten before production
create policy "dev_allow_all" on public.contacts
  for all using (true) with check (true);

create policy "dev_allow_all" on public.contact_activities
  for all using (true) with check (true);

-- ============================================================
-- FUNCTION: auto-log "created" activity on new contact
-- ============================================================
create or replace function public.log_contact_created()
returns trigger language plpgsql security definer as $$
begin
  insert into public.contact_activities (contact_id, type, body)
  values (new.id, 'created', 'Contact created');
  return new;
end;
$$;

drop trigger if exists log_contact_created on public.contacts;
create trigger log_contact_created
  after insert on public.contacts
  for each row execute function public.log_contact_created();

-- ============================================================
-- FUNCTION: auto-log status changes
-- ============================================================
create or replace function public.log_contact_status_change()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    insert into public.contact_activities (contact_id, type, body, metadata)
    values (
      new.id,
      'status_change',
      'Status changed from ' || old.status || ' to ' || new.status,
      jsonb_build_object('from_status', old.status, 'to_status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists log_contact_status_change on public.contacts;
create trigger log_contact_status_change
  after update on public.contacts
  for each row execute function public.log_contact_status_change();
