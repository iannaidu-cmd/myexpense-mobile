-- Lets a person override the app's ESTIMATED retirement/severance lump sum
-- tax (lib/taxRules.ts's retirementSeveranceLumpSumTax, applying SARS's
-- standard R550,000/18%/27%/36% table) with the REAL, authoritative tax
-- amount from an already-issued SARS tax directive. A directive can differ
-- from the standalone estimate because SARS's own calculation accounts for
-- factors the app cannot see (e.g. the person's full lifetime lump sum
-- history), so when someone already knows the actual figure it is strictly
-- more accurate than the estimate.
--
-- additional_lump_sums supports MULTIPLE lump sums in the same tax year
-- (e.g. a severance payout plus a separate share-scheme vesting lump sum,
-- each with their own directive) beyond the single primary lump sum already
-- covered by retirement_severance_lump_sum/actual_lump_sum_tax above. Each
-- array element is {"grossAmount": number, "actualTax": number | null},
-- matching lib/taxLiability.ts's LumpSumEntry shape exactly so no
-- translation layer is needed between the DB row and the calculation engine.

alter table public.tax_liability_estimates
  add column if not exists actual_lump_sum_tax numeric(12, 2),
  add column if not exists additional_lump_sums jsonb not null default '[]'::jsonb;
