-- New table backing the Tax Liability module (see lib/taxLiability.ts and
-- services/taxLiabilityService.ts). Deliberately keyed by (user_id,
-- tax_year): other_taxable_income, retirement_annuity_contributions,
-- tax_already_paid and donations_ytd are all per-tax-year figures, and a
-- user can be viewing a just-closed year's filed estimate while
-- simultaneously accruing the new, currently-open year's in-progress one —
-- a flat profiles column would let one year's entry clobber the other.
--
-- donations_ytd is nullable and unused by the v1 calculation engine (S18A
-- donations deduction is a v2 feature); the column exists now so v2 is
-- "turn the calculation on", with no migration required later.

create table if not exists public.tax_liability_estimates (
  id                                uuid primary key default gen_random_uuid(),
  user_id                           uuid not null references auth.users(id) on delete cascade,
  tax_year                         text not null,

  -- raw, editable inputs (mirrors lib/taxLiability.ts TaxLiabilityInput)
  other_taxable_income              numeric(12, 2) not null default 0,
  retirement_annuity_contributions  numeric(12, 2) not null default 0,
  tax_already_paid                  numeric(12, 2) not null default 0,
  donations_ytd                     numeric(12, 2),

  -- computed outputs (mirrors lib/taxLiability.ts TaxLiabilityResult)
  taxable_income                    numeric(12, 2) not null default 0,
  gross_tax                         numeric(12, 2) not null default 0,
  rebates_applied                   numeric(12, 2) not null default 0,
  medical_credit_applied            numeric(12, 2) not null default 0,
  final_liability                   numeric(12, 2) not null default 0,

  last_calculated_at                timestamptz not null default now(),
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now(),

  unique (user_id, tax_year)
);

alter table public.tax_liability_estimates enable row level security;
alter table public.tax_liability_estimates force row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'tax_liability_estimates'
    and policyname = 'Users can manage their own tax liability estimates'
  ) then
    create policy "Users can manage their own tax liability estimates"
      on public.tax_liability_estimates
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists tax_liability_estimates_user_year_idx
  on public.tax_liability_estimates(user_id, tax_year);
