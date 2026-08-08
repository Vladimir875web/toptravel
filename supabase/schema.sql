-- Telegram Travel Agency Mini App — schema
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Agencies
create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  telegram_manager_chat_id text not null,
  created_at timestamptz not null default now()
);

-- Tour categories
create table if not exists tour_categories (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (agency_id, slug)
);

-- Tours catalog
create table if not exists tours (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  category_id uuid references tour_categories(id) on delete set null,
  title text not null,
  destination text not null,
  description text not null default '',
  price_from numeric(12, 2),
  currency text not null default 'EUR',
  duration_days int,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists tours_agency_active_idx
  on tours (agency_id, is_active);

-- Leads / applications
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  tour_id uuid references tours(id) on delete set null,
  source text not null check (source in ('catalog', 'custom')),
  phone text not null,
  travel_dates text,
  budget text,
  wishes text,
  customer_name text,
  telegram_user_id bigint,
  telegram_username text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'done', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists leads_agency_created_idx
  on leads (agency_id, created_at desc);

-- Public read for catalog (anon key)
alter table agencies enable row level security;
alter table tour_categories enable row level security;
alter table tours enable row level security;
alter table leads enable row level security;

create policy "Public read agencies"
  on agencies for select
  using (true);

create policy "Public read categories"
  on tour_categories for select
  using (true);

create policy "Public read active tours"
  on tours for select
  using (is_active = true);

create policy "Anyone can create leads"
  on leads for insert
  with check (true);

-- Optional: managers read leads via service role / dashboard only
-- No public select on leads by design
