-- Bank accounts screen (app/bank-accounts.tsx) has never had a backing table,
-- so every insert/select against "bank_accounts" failed silently (the client
-- code didn't check the returned error). Users saving a bank account would
-- just get bounced back to an empty list with no error shown.

create table if not exists public.bank_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  bank_name       text not null,
  account_holder  text not null,
  account_number  text not null,
  branch_code     text not null,
  account_type    text not null default 'Cheque / Current',
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;
alter table public.bank_accounts force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bank_accounts'
    and policyname = 'Users can manage their own bank accounts'
  ) then
    create policy "Users can manage their own bank accounts"
      on public.bank_accounts
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists bank_accounts_user_id_idx on public.bank_accounts(user_id);
