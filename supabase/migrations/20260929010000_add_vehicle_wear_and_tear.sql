-- Wear-and-tear (s11(e)) on vehicles for self-employed users' actual-cost
-- vehicle claims.
--
-- SARS Interpretation Note 47 (Issue 5) / BGR 7 (Issue 4), annexure write-off
-- periods: passenger cars 5 years, delivery vehicles 4, motorcycles 4. The
-- allowance is apportioned on a time basis in the year the vehicle is
-- acquired and brought into use (IN47 §4.3.8), and apportioned for private
-- use (§4.3.7). Under s23C, VAT is excluded from cost only if the taxpayer is
-- a registered vendor AND was entitled to deduct that input tax, which is
-- why vat_claimed is its own flag rather than being inferred from the
-- profile's vat_registered.
--
-- The yearly claim is written into `expenses` as a system-managed Vehicle
-- Expenses row (one per vehicle per tax year) so it flows through every
-- existing total, report and export exactly like other deductions.

alter table public.vehicles
  add column if not exists vehicle_type text not null default 'passenger',
  add column if not exists vat_claimed  boolean not null default false;

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicles_vehicle_type_check'
  ) then
    alter table public.vehicles
      add constraint vehicles_vehicle_type_check
      check (vehicle_type in ('passenger', 'delivery', 'motorcycle'));
  end if;
end $$;

alter table public.expenses
  add column if not exists wear_and_tear_vehicle_id uuid;

do $$ begin
  -- SET NULL, not CASCADE: expenses are retained for 5 years after account
  -- deletion (see 20260715010000), and purging a user's vehicles must not
  -- cascade away a filed deduction. Single-column FK on purpose: the
  -- composite (vehicle, user) form would need Postgres 15's column-list
  -- SET NULL to avoid nulling user_id too. RLS already pins user_id.
  if not exists (
    select 1 from pg_constraint where conname = 'expenses_wear_and_tear_vehicle_fk'
  ) then
    alter table public.expenses
      add constraint expenses_wear_and_tear_vehicle_fk
      foreign key (wear_and_tear_vehicle_id)
      references public.vehicles(id)
      on delete set null;
  end if;
  -- One wear-and-tear row per vehicle per tax year (NULLs — every normal
  -- expense — never conflict).
  if not exists (
    select 1 from pg_constraint where conname = 'expenses_wear_and_tear_unique'
  ) then
    alter table public.expenses
      add constraint expenses_wear_and_tear_unique
      unique (wear_and_tear_vehicle_id, tax_year);
  end if;
end $$;
