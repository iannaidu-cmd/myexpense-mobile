-- ─────────────────────────────────────────────────────────────────────────────
-- Protect is_dev_user from client-side escalation
--
-- The profiles "FOR ALL" RLS policy (WITH CHECK auth.uid() = id) lets any
-- authenticated user UPDATE their own row — including setting is_dev_user = true
-- via a crafted API call. PostgreSQL RLS cannot restrict individual columns, so
-- we use a BEFORE UPDATE trigger instead.
--
-- To legitimately grant dev access from the Supabase SQL editor:
--   SET session_replication_role = 'replica';
--   UPDATE public.profiles SET is_dev_user = true WHERE id = '<user-id>';
--   RESET session_replication_role;
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_is_dev_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_dev_user IS DISTINCT FROM OLD.is_dev_user THEN
    RAISE EXCEPTION 'is_dev_user is read-only and cannot be changed by user sessions';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_is_dev_user ON public.profiles;
CREATE TRIGGER trg_protect_is_dev_user
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_is_dev_user();

-- ── Audit: who currently has dev access? ────────────────────────────────────
-- Run this in the Supabase SQL editor on production to verify the list is correct:
--
--   SELECT id, email, is_dev_user, subscription_status
--   FROM public.profiles
--   WHERE is_dev_user = true;
