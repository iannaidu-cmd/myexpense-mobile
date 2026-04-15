-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Audit Migration
-- Ensures Row Level Security is enabled on every user-data table and that
-- each table has exactly one "users see only their own rows" policy.
-- Safe to re-run: ALTER TABLE … ENABLE ROW LEVEL SECURITY is idempotent;
-- policies are guarded by DO blocks that check pg_policies first.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. expenses ──────────────────────────────────────────────────────────────
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses'
    AND policyname = 'Users can manage their own expenses'
  ) THEN
    CREATE POLICY "Users can manage their own expenses"
      ON public.expenses
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 2. income ─────────────────────────────────────────────────────────────────
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'income'
    AND policyname = 'Users can manage their own income'
  ) THEN
    CREATE POLICY "Users can manage their own income"
      ON public.income
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 3. profiles ───────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
    AND policyname = 'Users can manage their own profile'
  ) THEN
    CREATE POLICY "Users can manage their own profile"
      ON public.profiles
      FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ── 4. receipts ───────────────────────────────────────────────────────────────
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'receipts'
    AND policyname = 'Users can manage their own receipts'
  ) THEN
    CREATE POLICY "Users can manage their own receipts"
      ON public.receipts
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. tax_summary ────────────────────────────────────────────────────────────
ALTER TABLE public.tax_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_summary FORCE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tax_summary'
    AND policyname = 'Users can manage their own tax summary'
  ) THEN
    CREATE POLICY "Users can manage their own tax summary"
      ON public.tax_summary
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 6. mileage_trips — already has RLS from earlier migration, verify only ────
ALTER TABLE public.mileage_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mileage_trips FORCE ROW LEVEL SECURITY;

-- ── 7. Storage bucket: receipts ───────────────────────────────────────────────
-- These policies ensure users can only read/write inside their own
-- folder: receipts/{user_id}/...
-- The bucket must be set to PRIVATE in the Supabase dashboard so that
-- public URLs are rejected — storage policies alone do not block public URLs
-- on a public bucket.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload to their own receipt folder'
  ) THEN
    CREATE POLICY "Users can upload to their own receipt folder"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can read their own receipt folder'
  ) THEN
    CREATE POLICY "Users can read their own receipt folder"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can update their own receipt folder'
  ) THEN
    CREATE POLICY "Users can update their own receipt folder"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete their own receipt folder'
  ) THEN
    CREATE POLICY "Users can delete their own receipt folder"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'receipts'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- ── Verification query (run manually to confirm) ───────────────────────────────
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('expenses','income','profiles','receipts','tax_summary','mileage_trips');
--
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname IN ('public','storage')
-- ORDER BY schemaname, tablename, policyname;
