-- Turn mileage_trips into a SARS-acceptable travel logbook.
--
-- SARS's eLogbook requires, per business trip: date, km travelled, and
-- travel details (from, to, reason). Per vehicle and tax year it requires
-- an opening odometer reading on 1 March and a closing reading on the last
-- day of February ("Without these readings, you cannot claim a tax
-- deduction"), and a separate logbook for each vehicle used. The ITR12 also
-- asks for the vehicle's details and cost.
--
-- Until now trips had no vehicle, only raw lat/lng (no readable from/to),
-- and the annual odometer figure lived in AsyncStorage on the device.
--
-- Existing trips are left with vehicle_id = null so users can backfill them
-- in the app (Trip logbook → "Logbook incomplete"); vehicle_id is therefore
-- nullable here and enforced as required by the app for new trips.

-- ── Vehicles ─────────────────────────────────────────────────────────────────
create table if not exists public.vehicles (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  make           text not null,
  model          text not null,
  year           smallint not null check (year between 1950 and 2100),
  registration   text not null,
  -- Cost incl. VAT, excl. finance charges. Optional — needed for wear & tear
  -- (s11(e)) under the actual-cost method.
  purchase_price numeric(12, 2) check (purchase_price is null or purchase_price >= 0),
  acquired_date  date,
  -- Vehicles referenced by trips can't be deleted (see FK below), so a sold
  -- vehicle is archived instead — its logbook history must stay intact.
  is_archived    boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Target of the composite FKs below, so a row can only ever point at one of
  -- the same user's own vehicles.
  unique (id, user_id)
);

alter table public.vehicles enable row level security;
alter table public.vehicles force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicles'
    and policyname = 'Users can manage their own vehicles'
  ) then
    create policy "Users can manage their own vehicles"
      on public.vehicles
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists vehicles_user_id_idx on public.vehicles(user_id);

-- ── Odometer readings, one row per vehicle per tax year ──────────────────────
create table if not exists public.vehicle_odometer_readings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  vehicle_id  uuid not null,
  tax_year    text not null,
  -- Reading on 1 March, or on the day the vehicle started being used for
  -- business if that was later in the tax year.
  opening_km  numeric(10, 1) check (opening_km is null or opening_km >= 0),
  -- Reading on the last day of February (or when the vehicle stopped being used).
  closing_km  numeric(10, 1) check (closing_km is null or closing_km >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (vehicle_id, tax_year),
  check (opening_km is null or closing_km is null or closing_km >= opening_km),
  foreign key (vehicle_id, user_id)
    references public.vehicles(id, user_id) on delete cascade
);

alter table public.vehicle_odometer_readings enable row level security;
alter table public.vehicle_odometer_readings force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vehicle_odometer_readings'
    and policyname = 'Users can manage their own odometer readings'
  ) then
    create policy "Users can manage their own odometer readings"
      on public.vehicle_odometer_readings
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists vehicle_odometer_readings_user_year_idx
  on public.vehicle_odometer_readings(user_id, tax_year);

-- ── Logbook fields on mileage_trips ──────────────────────────────────────────
-- `notes` (already present) holds the SARS "reason for the trip"; `purpose`
-- stays as the category (Client Visit, Supplier, …).
alter table public.mileage_trips
  add column if not exists vehicle_id     uuid,
  add column if not exists start_address  text,
  add column if not exists end_address    text,
  add column if not exists odometer_start numeric(10, 1),
  add column if not exists odometer_end   numeric(10, 1),
  add column if not exists source         text not null default 'gps';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'mileage_trips_vehicle_fk'
  ) then
    -- NO ACTION (not RESTRICT): still blocks deleting a vehicle that has
    -- trips, but is checked at end of statement, so an auth.users cascade
    -- that removes both the trips and the vehicle together succeeds.
    alter table public.mileage_trips
      add constraint mileage_trips_vehicle_fk
      foreign key (vehicle_id, user_id)
      references public.vehicles(id, user_id) on delete no action;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'mileage_trips_source_check'
  ) then
    alter table public.mileage_trips
      add constraint mileage_trips_source_check check (source in ('gps', 'manual'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'mileage_trips_odometer_check'
  ) then
    alter table public.mileage_trips
      add constraint mileage_trips_odometer_check
      check (odometer_start is null or odometer_end is null or odometer_end >= odometer_start);
  end if;
end $$;

create index if not exists mileage_trips_vehicle_id_idx on public.mileage_trips(vehicle_id);
