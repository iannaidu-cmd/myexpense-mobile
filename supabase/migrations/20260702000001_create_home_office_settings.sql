-- Home office deduction setting, previously stored only in AsyncStorage on
-- the device (@myexpense:home_office_v1). That meant the floor-area ratio
-- used to calculate home-office deductions was lost on reinstall, never
-- synced across devices, and invisible to any server-side processing (e.g.
-- ITR12 export edge functions) even though it silently shrinks the amount
-- saved for Home Office / Utilities / Repairs & Maintenance expenses.

create table if not exists public.home_office_settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  office_m2        numeric(10, 2) not null,
  total_m2         numeric(10, 2) not null,
  arrangement_type text not null check (arrangement_type in ('owned', 'renting', 'none')),
  annual_cost      numeric(12, 2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.home_office_settings enable row level security;
alter table public.home_office_settings force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'home_office_settings'
    and policyname = 'Users can manage their own home office settings'
  ) then
    create policy "Users can manage their own home office settings"
      on public.home_office_settings
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
