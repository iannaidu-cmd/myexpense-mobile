-- Add category column to income table.
-- Stores the short friendly label (e.g. "Freelance", "Salary / Wage")
-- while source holds the full SARS-aligned description.

ALTER TABLE income
  ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;
