-- ============================================================
-- Braxton OS — Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation (already on in Supabase, but safe to include)
create extension if not exists "pgcrypto";


-- ============================================================
-- USERS
-- Mirrors auth.users but stores app-level profile data
-- ============================================================
create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  full_name   text,
  avatar_url  text,
  role        text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.users is 'App-level user profiles linked to Supabase Auth.';


-- ============================================================
-- COMPANIES
-- ============================================================
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  domain      text,
  industry    text,
  size        text,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.companies is 'Organizations associated with contacts and deals.';


-- ============================================================
-- CONTACTS
-- ============================================================
create table if not exists public.contacts (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid references public.companies(id) on delete set null,
  first_name          text not null,
  last_name           text not null,
  email               text,
  phone               text,
  role                text,
  status              text not null default 'lead' check (status in ('lead', 'prospect', 'customer', 'churned')),
  owner_id            uuid references public.users(id) on delete set null,
  last_contacted_at   timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.contacts is 'Individual people in the CRM.';

create index if not exists contacts_company_id_idx on public.contacts(company_id);
create index if not exists contacts_owner_id_idx   on public.contacts(owner_id);
create index if not exists contacts_status_idx     on public.contacts(status);


-- ============================================================
-- DEALS
-- ============================================================
create table if not exists public.deals (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact_id  uuid references public.contacts(id) on delete set null,
  company_id  uuid references public.companies(id) on delete set null,
  owner_id    uuid references public.users(id) on delete set null,
  stage       text not null default 'discovery' check (
                stage in ('discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost')
              ),
  value       numeric(12, 2),
  priority    text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  close_date  date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.deals is 'Sales opportunities tracked through the pipeline.';

create index if not exists deals_stage_idx      on public.deals(stage);
create index if not exists deals_owner_id_idx   on public.deals(owner_id);
create index if not exists deals_contact_id_idx on public.deals(contact_id);


-- ============================================================
-- DEAL TASKS
-- ============================================================
create table if not exists public.deal_tasks (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals(id) on delete cascade,
  title        text not null,
  completed    boolean not null default false,
  due_date     date,
  assigned_to  uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now()
);

comment on table public.deal_tasks is 'Action items attached to individual deals.';

create index if not exists deal_tasks_deal_id_idx on public.deal_tasks(deal_id);


-- ============================================================
-- CONVERSATIONS (Inbox threads)
-- ============================================================
create table if not exists public.conversations (
  id                uuid primary key default gen_random_uuid(),
  contact_id        uuid references public.contacts(id) on delete set null,
  subject           text,
  status            text not null default 'open' check (status in ('open', 'closed', 'snoozed')),
  channel           text not null default 'email' check (channel in ('email', 'linkedin', 'phone', 'other')),
  assigned_to       uuid references public.users(id) on delete set null,
  last_message_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.conversations is 'Inbox threads grouped by contact and channel.';

create index if not exists conversations_contact_id_idx on public.conversations(contact_id);
create index if not exists conversations_status_idx     on public.conversations(status);


-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id                uuid primary key default gen_random_uuid(),
  conversation_id   uuid not null references public.conversations(id) on delete cascade,
  sender_id         uuid references public.users(id) on delete set null,
  body              text not null,
  direction         text not null check (direction in ('inbound', 'outbound')),
  read              boolean not null default false,
  sent_at           timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

comment on table public.messages is 'Individual emails or messages inside a conversation.';

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_sent_at_idx         on public.messages(sent_at desc);


-- ============================================================
-- OUTREACH CAMPAIGNS
-- ============================================================
create table if not exists public.outreach_campaigns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  status      text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  owner_id    uuid references public.users(id) on delete set null,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.outreach_campaigns is 'Email/LinkedIn outreach campaigns.';


-- ============================================================
-- OUTREACH LEADS
-- Individual contact enrollment in a campaign
-- ============================================================
create table if not exists public.outreach_leads (
  id            uuid primary key default gen_random_uuid(),
  campaign_id   uuid not null references public.outreach_campaigns(id) on delete cascade,
  contact_id    uuid references public.contacts(id) on delete set null,
  status        text not null default 'pending' check (
                  status in ('pending', 'sent', 'opened', 'replied', 'bounced', 'unsubscribed')
                ),
  step          integer not null default 1,
  sent_at       timestamptz,
  opened_at     timestamptz,
  replied_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.outreach_leads is 'Per-contact status within an outreach campaign.';

create index if not exists outreach_leads_campaign_id_idx on public.outreach_leads(campaign_id);
create index if not exists outreach_leads_contact_id_idx  on public.outreach_leads(contact_id);
create index if not exists outreach_leads_status_idx      on public.outreach_leads(status);


-- ============================================================
-- NOTES
-- Polymorphic — can be attached to a contact, deal, or company
-- ============================================================
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  body          text not null,
  author_id     uuid references public.users(id) on delete set null,
  contact_id    uuid references public.contacts(id) on delete cascade,
  deal_id       uuid references public.deals(id) on delete cascade,
  company_id    uuid references public.companies(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- A note must belong to at least one entity
  constraint notes_has_parent check (
    contact_id is not null or deal_id is not null or company_id is not null
  )
);

comment on table public.notes is 'Free-form notes attached to contacts, deals, or companies.';

create index if not exists notes_contact_id_idx on public.notes(contact_id);
create index if not exists notes_deal_id_idx    on public.notes(deal_id);
create index if not exists notes_company_id_idx on public.notes(company_id);


-- ============================================================
-- AUTO-UPDATE updated_at
-- Trigger function applied to every table that has updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to each relevant table
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'companies', 'contacts', 'deals',
    'conversations', 'outreach_campaigns', 'outreach_leads', 'notes'
  ]
  loop
    execute format(
      'create trigger set_updated_at
       before update on public.%I
       for each row execute function public.set_updated_at()',
      t
    );
  end loop;
exception when duplicate_object then
  null; -- triggers already exist, skip
end;
$$;


-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- Enables RLS on all tables. Policies to be added with auth.
-- For now: allows full access when using the service-role key,
-- anon key will be locked down once auth is wired up.
-- ============================================================
alter table public.users               enable row level security;
alter table public.companies           enable row level security;
alter table public.contacts            enable row level security;
alter table public.deals               enable row level security;
alter table public.deal_tasks          enable row level security;
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.outreach_campaigns  enable row level security;
alter table public.outreach_leads      enable row level security;
alter table public.notes               enable row level security;

-- Temporary open policy for development — REMOVE before production
-- These let the anon key read/write everything while you build.
do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'companies', 'contacts', 'deals', 'deal_tasks',
    'conversations', 'messages', 'outreach_campaigns', 'outreach_leads', 'notes'
  ]
  loop
    execute format(
      'create policy "dev_allow_all" on public.%I for all using (true) with check (true)',
      t
    );
  end loop;
exception when duplicate_object then
  null;
end;
$$;
