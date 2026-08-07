-- Bank statement import and ITR12 export used to be fully Pro-gated (zero
-- free-tier access at all — see the removed "Pro-only" comments in
-- app/bank-import.tsx and app/itr12-export-setup.tsx). They're moving to the
-- same 20-uses/month free-tier model already used for receipt scans
-- (constants/freeTier.ts FREE_SCAN_LIMIT) and manual expense entry
-- (FREE_EXPENSE_LIMIT). Both of those are counted directly off an existing
-- table (receipts / expenses), but neither bank import nor ITR12 export logs
-- an event anywhere today — a bank import inserts N expense rows per import
-- session (not one row per import), and an export writes no row at all. So
-- each gets its own minimal one-row-per-use log table to count against.
--
-- Mileage tracking is also moving to this model (FREE_MILEAGE_TRIP_LIMIT),
-- but needs no new table — mileage_trips already has one row per saved trip.

create table if not exists public.bank_import_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.bank_import_log enable row level security;
alter table public.bank_import_log force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bank_import_log'
    and policyname = 'Users can manage their own bank import log'
  ) then
    create policy "Users can manage their own bank import log"
      on public.bank_import_log
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists bank_import_log_user_id_idx on public.bank_import_log(user_id);

create table if not exists public.itr12_export_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.itr12_export_log enable row level security;
alter table public.itr12_export_log force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'itr12_export_log'
    and policyname = 'Users can manage their own ITR12 export log'
  ) then
    create policy "Users can manage their own ITR12 export log"
      on public.itr12_export_log
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists itr12_export_log_user_id_idx on public.itr12_export_log(user_id);
