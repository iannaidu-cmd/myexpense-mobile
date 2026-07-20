-- 20260626000000_add_category_to_income.sql is recorded as applied in
-- supabase_migrations.schema_migrations, but the 'category' column is
-- missing from the live income table (PGRST204 on insert). Re-apply the
-- idempotent ADD COLUMN and force PostgREST to reload its schema cache.

ALTER TABLE income
  ADD COLUMN IF NOT EXISTS category text DEFAULT NULL;

NOTIFY pgrst, 'reload schema';
