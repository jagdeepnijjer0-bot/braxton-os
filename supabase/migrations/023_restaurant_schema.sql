-- ============================================================
-- Restaurant App Schema
-- ============================================================

-- ============================================================
-- set_updated_at helper (safe to run even if already exists)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- RESTAURANT PROFILES
-- Extended profile for restaurant app users
-- ============================================================
create table if not exists public.restaurant_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.restaurant_profiles is 'Restaurant app user profiles.';

create trigger set_restaurant_profiles_updated_at
  before update on public.restaurant_profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_restaurant_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.restaurant_profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_restaurant on auth.users;
create trigger on_auth_user_created_restaurant
  after insert on auth.users
  for each row execute function public.handle_new_restaurant_user();


-- ============================================================
-- MENU ITEMS
-- ============================================================
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  price         numeric(10, 2) not null,
  category      text not null,
  image_url     text,
  is_available  boolean not null default true,
  is_featured   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.menu_items is 'Restaurant menu items.';

create index if not exists menu_items_category_idx   on public.menu_items(category);
create index if not exists menu_items_available_idx  on public.menu_items(is_available);
create index if not exists menu_items_featured_idx   on public.menu_items(is_featured);

create trigger set_menu_items_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();


-- ============================================================
-- GALLERY IMAGES
-- ============================================================
create table if not exists public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  image_url     text not null,
  caption       text,
  order_index   integer not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.gallery_images is 'Restaurant gallery images.';

create index if not exists gallery_images_order_idx on public.gallery_images(order_index);


-- ============================================================
-- RESERVATIONS
-- ============================================================
create table if not exists public.reservations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  email       text not null,
  phone       text not null,
  date        date not null,
  time        time not null,
  guests      integer not null check (guests >= 1 and guests <= 20),
  notes       text,
  status      text not null default 'pending'
                check (status in ('pending', 'confirmed', 'cancelled')),
  created_at  timestamptz not null default now()
);

comment on table public.reservations is 'Table reservations.';

create index if not exists reservations_date_idx    on public.reservations(date);
create index if not exists reservations_email_idx   on public.reservations(email);
create index if not exists reservations_user_id_idx on public.reservations(user_id);
create index if not exists reservations_status_idx  on public.reservations(status);


-- ============================================================
-- CONTACT MESSAGES
-- ============================================================
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  message     text not null,
  created_at  timestamptz not null default now()
);

comment on table public.contact_messages is 'Contact form submissions.';


-- ============================================================
-- RESTAURANT MEMBERSHIPS
-- Tracks Stripe subscription state per user
-- ============================================================
create table if not exists public.restaurant_memberships (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id       text unique,
  stripe_subscription_id   text unique,
  status                   text not null default 'inactive'
                             check (status in ('active', 'inactive', 'cancelled', 'past_due')),
  plan                     text not null default 'premium',
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint restaurant_memberships_user_id_unique unique (user_id)
);

comment on table public.restaurant_memberships is 'Premium membership + Stripe subscription state.';

create index if not exists restaurant_memberships_user_id_idx    on public.restaurant_memberships(user_id);
create index if not exists restaurant_memberships_status_idx     on public.restaurant_memberships(status);
create index if not exists restaurant_memberships_stripe_sub_idx on public.restaurant_memberships(stripe_subscription_id);

create trigger set_restaurant_memberships_updated_at
  before update on public.restaurant_memberships
  for each row execute function public.set_updated_at();


-- ============================================================
-- COFFEE CLAIMS
-- One free coffee claim per user per calendar month
-- ============================================================
create table if not exists public.coffee_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  claimed_at  timestamptz not null default now(),
  month_year  text not null,  -- format: 'YYYY-MM'
  constraint coffee_claims_user_month_unique unique (user_id, month_year)
);

comment on table public.coffee_claims is 'Monthly free coffee claims for premium members.';

create index if not exists coffee_claims_user_id_idx   on public.coffee_claims(user_id);
create index if not exists coffee_claims_month_idx     on public.coffee_claims(month_year);


-- ============================================================
-- STORAGE BUCKETS
-- Created via Supabase dashboard or CLI, documented here
-- ============================================================
-- Buckets to create manually in Supabase Dashboard > Storage:
--   gallery          (public: true)
--   menu-images      (public: true)
--   restaurant-assets (public: true)


-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
alter table public.restaurant_profiles     enable row level security;
alter table public.menu_items              enable row level security;
alter table public.gallery_images          enable row level security;
alter table public.reservations            enable row level security;
alter table public.contact_messages        enable row level security;
alter table public.restaurant_memberships  enable row level security;
alter table public.coffee_claims           enable row level security;


-- restaurant_profiles: users can read/update their own
create policy "restaurant_profiles: own read"
  on public.restaurant_profiles for select
  using (auth.uid() = id);

create policy "restaurant_profiles: own update"
  on public.restaurant_profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "restaurant_profiles: own insert"
  on public.restaurant_profiles for insert
  with check (auth.uid() = id);


-- menu_items: public read
create policy "menu_items: public read"
  on public.menu_items for select
  using (true);


-- gallery_images: public read
create policy "gallery_images: public read"
  on public.gallery_images for select
  using (true);


-- reservations: users can insert; can read their own
create policy "reservations: insert"
  on public.reservations for insert
  with check (true);

create policy "reservations: own read"
  on public.reservations for select
  using (auth.uid() = user_id or user_id is null);


-- contact_messages: anyone can insert
create policy "contact_messages: insert"
  on public.contact_messages for insert
  with check (true);


-- restaurant_memberships: users read/manage own
create policy "restaurant_memberships: own read"
  on public.restaurant_memberships for select
  using (auth.uid() = user_id);

create policy "restaurant_memberships: service role full access"
  on public.restaurant_memberships for all
  using (auth.role() = 'service_role');


-- coffee_claims: users manage own
create policy "coffee_claims: own read"
  on public.coffee_claims for select
  using (auth.uid() = user_id);

create policy "coffee_claims: own insert"
  on public.coffee_claims for insert
  with check (auth.uid() = user_id);


-- ============================================================
-- SEED DATA — sample menu items
-- ============================================================
insert into public.menu_items (name, description, price, category, is_available, is_featured) values
  ('Beef Tartare', 'Hand-cut Wagyu beef, capers, cornichons, quail egg', 22.00, 'starters', true, true),
  ('Burrata & Heritage Tomatoes', 'Stracciatella, basil oil, aged balsamic', 16.00, 'starters', true, false),
  ('Pan-Seared Scallops', 'Cauliflower purée, crispy pancetta, truffle oil', 28.00, 'starters', true, true),
  ('Duck Confit', '72-hour confit, cherry jus, dauphinoise potato', 38.00, 'mains', true, true),
  ('Châteaubriand', '400g dry-aged for two, seasonal vegetables, béarnaise', 95.00, 'mains', true, false),
  ('Grilled Sea Bass', 'Saffron beurre blanc, samphire, crushed new potatoes', 36.00, 'mains', true, false),
  ('Wild Mushroom Risotto', 'Porcini, truffle, 24-month aged Parmesan', 28.00, 'mains', true, false),
  ('Crème Brûlée', 'Classic vanilla, caramelised sugar, shortbread', 12.00, 'desserts', true, false),
  ('Chocolate Fondant', 'Valrhona 70%, salted caramel ice cream', 14.00, 'desserts', true, true),
  ('Cheese Selection', 'Three British & French cheeses, quince, crackers', 18.00, 'desserts', true, false),
  ('Braxton Old Fashioned', 'Bourbon, house-made bitters, smoked orange', 16.00, 'drinks', true, false),
  ('Aperol Spritz', 'Aperol, prosecco, soda, blood orange', 14.00, 'drinks', true, false),
  ('Sommelier''s Wine Flight', 'Three paired glasses selected by our sommelier', 42.00, 'drinks', true, false),
  ('Flat White', 'Single origin espresso, silky microfoam', 5.50, 'drinks', true, false)
on conflict do nothing;
