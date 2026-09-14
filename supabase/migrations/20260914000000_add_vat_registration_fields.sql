-- VAT registration status and number, surfaced on the Profile screen
-- (app/profile.tsx, Tax profile section) alongside the other stable
-- account-level tax attributes (has_disability etc., see
-- 20260803000000_add_tax_liability_profile_fields.sql).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS vat_registered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vat_number text;
