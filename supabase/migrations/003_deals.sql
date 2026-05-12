-- ============================================================
-- Migration 003: Deal Tracker — Property Acquisition Pipeline
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ============================================================
-- DEALS
-- ============================================================
create table if not exists public.deals (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- Identity
  deal_name             text not null,
  address               text,

  -- Financials
  purchase_price        numeric(12,2),
  estimated_value       numeric(12,2),
  monthly_rent          numeric(10,2),
  refurb_cost           numeric(12,2),
  projected_profit      numeric(12,2),

  -- Status tracking
  investor_status       text default 'none' check (investor_status in (
                          'none', 'interested', 'confirmed', 'withdrawn'
                        )),
  solicitor_status      text default 'not_instructed' check (solicitor_status in (
                          'not_instructed', 'instructed', 'progressing', 'completed'
                        )),

  -- Pipeline stage
  stage                 text not null default 'lead_found' check (stage in (
                          'lead_found',
                          'reviewing',
                          'offer_made',
                          'under_negotiation',
                          'investor_interested',
                          'legals',
                          'refurb',
                          'sold_completed',
                          'dead'
                        )),

  -- Notes & planning
  notes                 text,
  next_action           text,
  target_completion_date date,

  -- Relations
  linked_contact_id     uuid references public.contacts(id) on delete set null,
  assigned_to           uuid references public.users(id) on delete set null
);

comment on table public.deals is 'Property acquisition pipeline deals.';

create index deals_stage_idx             on public.deals(stage);
create index deals_linked_contact_idx    on public.deals(linked_contact_id);
create index deals_assigned_to_idx       on public.deals(assigned_to);
create index deals_target_completion_idx on public.deals(target_completion_date);

-- ============================================================
-- DEAL ACTIVITIES
-- Append-only log for every action on a deal
-- ============================================================
create table if not exists public.deal_activities (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals(id) on delete cascade,
  created_at  timestamptz not null default now(),

  type        text not null check (type in (
                'note',
                'call',
                'email',
                'meeting',
                'stage_change',
                'offer_made',
                'created',
                'financial_update'
              )),

  body        text not null,
  metadata    jsonb,
  created_by  uuid references public.users(id) on delete set null
);

comment on table public.deal_activities is 'Immutable activity log for each deal.';

create index deal_activities_deal_id_idx   on public.deal_activities(deal_id);
create index deal_activities_created_at_idx on public.deal_activities(created_at desc);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ============================================================
-- AUTO-LOG: deal created
-- ============================================================
create or replace function public.log_deal_created()
returns trigger language plpgsql security definer as $$
begin
  insert into public.deal_activities (deal_id, type, body)
  values (new.id, 'created', 'Deal added to pipeline');
  return new;
end;
$$;

drop trigger if exists log_deal_created on public.deals;
create trigger log_deal_created
  after insert on public.deals
  for each row execute function public.log_deal_created();

-- ============================================================
-- AUTO-LOG: stage changes
-- ============================================================
create or replace function public.log_deal_stage_change()
returns trigger language plpgsql security definer as $$
begin
  if old.stage is distinct from new.stage then
    insert into public.deal_activities (deal_id, type, body, metadata)
    values (
      new.id,
      'stage_change',
      'Moved from ' || replace(old.stage, '_', ' ') || ' → ' || replace(new.stage, '_', ' '),
      jsonb_build_object('from_stage', old.stage, 'to_stage', new.stage)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists log_deal_stage_change on public.deals;
create trigger log_deal_stage_change
  after update on public.deals
  for each row execute function public.log_deal_stage_change();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.deals            enable row level security;
alter table public.deal_activities  enable row level security;

create policy "dev_allow_all" on public.deals
  for all using (true) with check (true);

create policy "dev_allow_all" on public.deal_activities
  for all using (true) with check (true);
