-- Create mileage_trips table for storing tracked business trips
create table if not exists public.mileage_trips (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  purpose          text not null,
  distance_km      numeric(10, 3) not null default 0,
  duration_seconds integer not null default 0,
  start_lat        double precision,
  start_lng        double precision,
  end_lat          double precision,
  end_lng          double precision,
  tax_year         text not null,
  is_deductible    boolean not null default true,
  notes            text,
  trip_date        date not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.mileage_trips enable row level security;

-- Users can only access their own trips
create policy "Users can manage their own mileage trips"
  on public.mileage_trips
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast per-user lookups
create index if not exists mileage_trips_user_id_idx on public.mileage_trips(user_id);
create index if not exists mileage_trips_tax_year_idx on public.mileage_trips(user_id, tax_year);
