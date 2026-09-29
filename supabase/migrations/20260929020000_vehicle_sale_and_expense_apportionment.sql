-- 1. Selling a vehicle (SARS IN47 §4.3.8, IN60 §4.3.5)
--    Wear & tear stops at the sale (apportioned in the year of sale). If the
--    proceeds (capped at cost) exceed the tax value (cost − wear & tear,
--    ignoring private use), the excess is a recoupment under s8(4)(a),
--    included in income. The app keeps that as a system-managed `income` row
--    per vehicle, like the wear-and-tear `expenses` row.
--    (A loss on sale, s11(o), is shown but not yet claimed.)
--
-- 2. Keeping the full amount and the % applied on apportioned expenses
--    Vehicle (and other partly-business) expenses are saved already reduced
--    by the business-use % in force on the day they were entered. The full
--    amount wasn't kept, so a year-end change in the logbook % couldn't be
--    applied, and the planned employee travel-allowance claim (actual costs,
--    s8(1)(b)) couldn't be worked out. gross_amount / business_use_pct keep
--    both; expenses.vehicle_id ties a vehicle cost to the vehicle it was for,
--    which that per-vehicle claim needs.
--
-- 3. logbook_export_log: free-tier cap on logbook exports (see bottom).

alter table public.vehicles
  add column if not exists sold_date  date,
  add column if not exists sale_price numeric(12, 2);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'vehicles_sale_check') then
    alter table public.vehicles
      add constraint vehicles_sale_check check (
        (sale_price is null or sale_price >= 0)
        and (sold_date is null or acquired_date is null or sold_date >= acquired_date)
      );
  end if;
end $$;

-- ── Recoupment income row ────────────────────────────────────────────────────
alter table public.income
  add column if not exists recoupment_vehicle_id uuid;

do $$ begin
  -- SET NULL, same reasoning as expenses.wear_and_tear_vehicle_id: income
  -- is retained after account deletion, vehicles are purged.
  if not exists (select 1 from pg_constraint where conname = 'income_recoupment_vehicle_fk') then
    alter table public.income
      add constraint income_recoupment_vehicle_fk
      foreign key (recoupment_vehicle_id) references public.vehicles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'income_recoupment_unique') then
    alter table public.income
      add constraint income_recoupment_unique unique (recoupment_vehicle_id, tax_year);
  end if;
end $$;

-- ── Expense apportionment detail ─────────────────────────────────────────────
alter table public.expenses
  add column if not exists gross_amount     numeric(12, 2),
  add column if not exists business_use_pct numeric(5, 2),
  add column if not exists vehicle_id       uuid;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_business_use_pct_check') then
    alter table public.expenses
      add constraint expenses_business_use_pct_check
      check (business_use_pct is null or (business_use_pct >= 0 and business_use_pct <= 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'expenses_vehicle_fk') then
    alter table public.expenses
      add constraint expenses_vehicle_fk
      foreign key (vehicle_id) references public.vehicles(id) on delete set null;
  end if;
end $$;

-- 3. Logbook export usage log — free-tier cap, same mechanism as
--    itr12_export_log (20260803010000): one row per successful export.
create table if not exists public.logbook_export_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.logbook_export_log enable row level security;
alter table public.logbook_export_log force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'logbook_export_log'
    and policyname = 'Users can manage their own logbook export log'
  ) then
    create policy "Users can manage their own logbook export log"
      on public.logbook_export_log
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists logbook_export_log_user_id_idx on public.logbook_export_log(user_id);

-- 4. Double-cab bakkies get their own vehicle type. SARS's VAT definition of
--    "motor car" includes them (so purchase VAT can't be claimed), and they're
--    written off over 5 years like passenger cars (see lib/wearAndTear.ts).
alter table public.vehicles drop constraint if exists vehicles_vehicle_type_check;
alter table public.vehicles
  add constraint vehicles_vehicle_type_check
  check (vehicle_type in ('passenger', 'double_cab', 'delivery', 'motorcycle'));
