-- RevenueCat purchases currently only update local device state
-- (stores/subscriptionStore.ts) and never reach the `profiles` table, so
-- authStore.isPremium (the only thing that actually gates features) never
-- learns about a real purchase, cancellation, or failed payment. This adds
-- the columns the new RevenueCat webhook (supabase/functions/revenuecat-webhook)
-- needs to keep `profiles` in sync, plus a billing_issue_detected_at marker
-- the client uses to compute a 7-day grace period before blocking access
-- after a failed renewal payment.
--
-- Along the way: `subscription` and `promo_expires_at` were NOT protected by
-- the existing protect_is_dev_user trigger, meaning any authenticated user
-- could PATCH their own profiles row via the Supabase REST API and grant
-- themselves Pro for free. This replaces that trigger with a broader one
-- covering all billing-related columns, writable only by the service role
-- (i.e. only the webhook, not client sessions).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS billing_issue_detected_at timestamptz;

-- Replace is_dev_user-only protection with broader billing-field protection.
-- The old trigger blocked service-role writes too (hence its comment
-- recommending a manual session_replication_role='replica' bypass for
-- SQL-editor use) — this version exempts the service role so the webhook's
-- writes go through without needing that workaround. Manual grants via the
-- SQL editor (e.g. promo_expires_at, is_dev_user) still need the bypass,
-- same as before.
CREATE OR REPLACE FUNCTION public.protect_billing_fields()
  RETURNS TRIGGER
  LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_is_dev_user ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_billing_fields ON public.profiles;
CREATE TRIGGER trg_protect_billing_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_billing_fields();

NOTIFY pgrst, 'reload schema';
