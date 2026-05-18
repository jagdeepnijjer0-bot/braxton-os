-- ── 012: Meta / Instagram Integration ────────────────────────────────────────

-- Integration settings table (one row per platform)
create table if not exists meta_integration_settings (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  platform     text not null check (platform in ('instagram', 'facebook')),
  page_id      text,
  page_name    text,
  is_connected boolean not null default false,
  connected_at timestamptz,
  unique (platform)
);

-- Seed default rows so GET always returns something
insert into meta_integration_settings (platform, is_connected)
  values ('instagram', false), ('facebook', false)
  on conflict (platform) do nothing;

-- Updated_at trigger (reuse the set_updated_at function from 006_inbox.sql)
drop trigger if exists trg_meta_settings_updated_at on meta_integration_settings;
create trigger trg_meta_settings_updated_at
  before update on meta_integration_settings
  for each row execute function set_updated_at();

-- RLS: only authenticated users can read/update
alter table meta_integration_settings enable row level security;

create policy "authenticated_read_meta_settings"
  on meta_integration_settings for select
  using (auth.uid() is not null);

create policy "authenticated_update_meta_settings"
  on meta_integration_settings for update
  using (auth.uid() is not null);

-- ── Add external IDs to inbox tables ─────────────────────────────────────────
-- external_thread_id: Meta sender PSID/IGSID — used to find existing conversations
alter table inbox_conversations
  add column if not exists external_thread_id text;

create index if not exists inbox_conversations_external_thread_id_idx
  on inbox_conversations (external_thread_id)
  where external_thread_id is not null;

-- external_message_id: Meta message MID — used to deduplicate inbound messages
alter table inbox_messages
  add column if not exists external_message_id text unique;
