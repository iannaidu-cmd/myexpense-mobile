-- VAT included in an income payment.
--
-- A VAT vendor's local payments include 15% VAT (output tax they owe SARS),
-- while foreign payments are zero-rated and don't. Until now income had no
-- VAT concept, so a vendor's taxable income included the VAT they charged.
--
-- `amount` stays as the money received (what the bank shows). `vat_amount` is
-- the VAT inside it, set per entry by the user. Income-tax totals, ITR12
-- turnover and the VAT threshold all use amount - vat_amount (lib/vat.ts).
--
-- Existing rows default to 0, so nothing changes until a user marks an entry.

ALTER TABLE income
  ADD COLUMN IF NOT EXISTS vat_amount numeric(12, 2) NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'income_vat_amount_range'
  ) THEN
    ALTER TABLE income
      ADD CONSTRAINT income_vat_amount_range
      CHECK (vat_amount >= 0 AND vat_amount <= amount);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
