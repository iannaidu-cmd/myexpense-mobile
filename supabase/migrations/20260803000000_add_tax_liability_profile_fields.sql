-- Profile-level inputs for the Tax Liability module (lib/taxLiability.ts).
-- Relatively stable, not year-specific — see
-- 20260803000001_create_tax_liability_estimates.sql for the per-tax-year
-- figures (other income, tax already paid, etc.), which live on their own
-- table instead of here because a flat profiles column can't hold two
-- coexisting tax years' worth of those figures at once (a user may be
-- viewing a just-closed year's filed estimate while accruing the new,
-- currently-open year's in-progress one).
--
-- has_disability also moves here off stores/taxProfileStore.ts's
-- AsyncStorage-only field, so it isn't left as the one orphaned local-only
-- field once the rest of the on-device "tax profile" migrates to Supabase.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS medical_aid_monthly numeric(12, 2),
  ADD COLUMN IF NOT EXISTS medical_aid_dependants integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS has_disability boolean NOT NULL DEFAULT false;
