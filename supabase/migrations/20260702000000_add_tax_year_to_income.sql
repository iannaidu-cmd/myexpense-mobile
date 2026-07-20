-- Add tax_year to income, so income can be scoped per SA tax year like
-- expenses (tax_year) and mileage_trips (tax_year) already are. Until now the
-- income table had no year concept at all, so income totals were always
-- lifetime figures regardless of the tax year the user was viewing.
--
-- A BEFORE INSERT/UPDATE trigger derives tax_year from `date` server-side
-- whenever it's left NULL, rather than trusting the client to always send it.
-- expenses had exactly this class of bug (see 20260630000001_fix_expense_tax_years.sql,
-- caused by a stale hardcoded constant) — this trigger means old app builds
-- that don't yet send tax_year keep working, and the value is always correct
-- rather than only correct after the client happens to compute it right.

CREATE OR REPLACE FUNCTION public.compute_sa_tax_year(d date)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    start_year::text || '/' || LPAD(((start_year + 1) % 100)::text, 2, '0')
  FROM (
    SELECT CASE WHEN EXTRACT(MONTH FROM d)::int >= 3
             THEN EXTRACT(YEAR FROM d)::int
             ELSE EXTRACT(YEAR FROM d)::int - 1
           END AS start_year
  ) sub
$$;

ALTER TABLE income
  ADD COLUMN IF NOT EXISTS tax_year text;

UPDATE income
SET tax_year = public.compute_sa_tax_year(date::date)
WHERE tax_year IS NULL;

CREATE OR REPLACE FUNCTION public.set_income_tax_year()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tax_year IS NULL THEN
    NEW.tax_year := public.compute_sa_tax_year(NEW.date::date);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS income_set_tax_year ON income;
CREATE TRIGGER income_set_tax_year
  BEFORE INSERT OR UPDATE ON income
  FOR EACH ROW
  EXECUTE FUNCTION public.set_income_tax_year();

ALTER TABLE income
  ALTER COLUMN tax_year SET NOT NULL;

CREATE INDEX IF NOT EXISTS income_tax_year_idx ON income(user_id, tax_year);
