-- Fix: new-user signup failing with "Database error saving new user".
--
-- Root cause (confirmed via Postgres logs for a real failed signup): the
-- tester-promo-access trigger on auth.users (on_tester_signup ->
-- handle_tester_promo_access(), provided externally to grant a hardcoded
-- list of tester emails 14 days of promo access) writes
-- profiles.promo_expires_at as part of the auth.users insert cascade. That
-- write is server-side — it never goes through PostgREST — so
-- auth.role() (which only reads the request.jwt.claim.role session
-- setting PostgREST sets) is NULL, not 'service_role'. protect_billing_fields()
-- only exempted 'service_role', so it rejected the write with
-- "promo_expires_at is read-only and cannot be changed by user sessions",
-- aborting the whole auth.users insert transaction and surfacing as a
-- signup failure for anyone on that tester list.
--
-- Fix: also exempt auth.role() IS NULL — i.e. writes originating outside
-- PostgREST (internal triggers, direct SQL) — since those can't be a
-- client session forging a REST call in the first place. A real
-- authenticated client session always has auth.role() = 'authenticated',
-- so this does not reopen the client-side escalation the trigger exists
-- to block.
CREATE OR REPLACE FUNCTION public.protect_billing_fields()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' OR auth.role() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_dev_user IS DISTINCT FROM OLD.is_dev_user THEN
    RAISE EXCEPTION 'is_dev_user is read-only and cannot be changed by user sessions';
  END IF;
  IF NEW.subscription IS DISTINCT FROM OLD.subscription THEN
    RAISE EXCEPTION 'subscription is managed by RevenueCat and cannot be changed directly';
  END IF;
  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'subscription_expires_at is managed by RevenueCat and cannot be changed directly';
  END IF;
  IF NEW.billing_issue_detected_at IS DISTINCT FROM OLD.billing_issue_detected_at THEN
    RAISE EXCEPTION 'billing_issue_detected_at is managed by RevenueCat and cannot be changed directly';
  END IF;
  IF NEW.promo_expires_at IS DISTINCT FROM OLD.promo_expires_at THEN
    RAISE EXCEPTION 'promo_expires_at is read-only and cannot be changed by user sessions';
  END IF;
  IF NEW.purged_at IS DISTINCT FROM OLD.purged_at THEN
    RAISE EXCEPTION 'purged_at is set only by the account-deletion purge process';
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
