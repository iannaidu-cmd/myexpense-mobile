-- ─────────────────────────────────────────────────────────────────────────────
-- Fix duplicate / stale RLS policies on receipts table and storage.objects.
--
-- The project was bootstrapped with auto-generated Supabase policies
-- ("receipts: own rows", "Users can …receipts 1lnm9mj_N") that conflict with
-- or duplicate the explicit policies added in the previous migration.  Having
-- two permissive policies for the same command is harmless in theory, but the
-- auto-generated ones have WITH CHECK = NULL (inherits USING for INSERT) which
-- can behave unexpectedly depending on Postgres version.  Remove all duplicates
-- and replace with one clean policy per operation.
--
-- Safe to re-run: all DROPs are guarded with IF EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. receipts table ────────────────────────────────────────────────────────

-- Drop the auto-generated policy that has WITH CHECK = null
DROP POLICY IF EXISTS "receipts: own rows" ON public.receipts;

-- Ensure the explicit policy exists (idempotent re-create)
DROP POLICY IF EXISTS "Users can manage their own receipts" ON public.receipts;
CREATE POLICY "Users can manage their own receipts"
  ON public.receipts
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 2. storage.objects — remove auto-generated duplicates ───────────────────

DROP POLICY IF EXISTS "Users can upload their own receipts 1lnm9mj_0"  ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own receipts 1lnm9mj_0"    ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts 1lnm9mj_0"  ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts 1lnm9mj_0"  ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipts 1lnm9mj_1"  ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own receipts 1lnm9mj_1"    ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipts 1lnm9mj_1"  ON storage.objects;

-- ── 3. storage.objects — clean re-create of our canonical policies ───────────

DROP POLICY IF EXISTS "Users can upload to their own receipt folder"  ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own receipt folder"       ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own receipt folder"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own receipt folder"     ON storage.objects;

CREATE POLICY "Users can upload to their own receipt folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can read their own receipt folder"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can update their own receipt folder"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

CREATE POLICY "Users can delete their own receipt folder"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
