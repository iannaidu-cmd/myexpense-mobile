-- Protect profiles.refunded_at from client writes.
--
-- refunded_at (added by cancel-cutoff-7-days.sql) marks a refunded user whose
-- Pro access ends 7 days after the refund, when the expire-refunded-pro cron
-- job switches them to free. That job only looks at rows with refunded_at
-- set, so a user clearing it from the client would keep Pro forever. Only
-- the revenuecat-webhook (service role) and the cron job (no PostgREST role)
-- may change it.
--
-- Must run AFTER refunded_at exists: plpgsql resolves NEW.refunded_at at
-- runtime, so without the column every client profile update would fail.
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
  IF NEW.refunded_at IS DISTINCT FROM OLD.refunded_at THEN
    RAISE EXCEPTION 'refunded_at is managed by RevenueCat and cannot be changed directly';
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
