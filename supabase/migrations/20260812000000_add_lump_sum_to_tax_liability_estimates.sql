-- Adds retirement/severance lump sum support to the Tax Liability module.
-- Previously any lump sum (e.g. a retrenchment severance payout) had to be
-- entered into "other_taxable_income" and was taxed at normal marginal
-- rates via lib/taxLiability.ts's main bracket calculation. SARS actually
-- taxes qualifying retirement/death/severance lump sums on a completely
-- separate table (first R550,000 tax-free — see
-- retirementSeveranceLumpSumTax in lib/taxRules.ts), so folding it into
-- other_taxable_income significantly overstated tax owed for anyone
-- retrenched, retired, or receiving a death benefit lump sum during the
-- tax year.
--
-- prior_retirement_severance_lump_sums supports the lifetime R550,000
-- aggregation rule: the tax-free amount applies across a person's whole
-- life, not per payout, so a second/later lump sum needs to know how much
-- of the tax-free portion earlier lump sums already used up.

alter table public.tax_liability_estimates
  add column if not exists retirement_severance_lump_sum numeric(12, 2) not null default 0,
  add column if not exists prior_retirement_severance_lump_sums numeric(12, 2) not null default 0,
  add column if not exists lump_sum_tax numeric(12, 2) not null default 0;
