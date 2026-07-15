-- Account deletion originally did full deletion of everything, including
-- expenses/income. Revised per the published Account & Data Deletion Policy
-- (myexpense.co.za/account-deletion.html) and the existing Privacy Policy
-- retention clause: transaction/expense records tied to tax filings are now
-- retained 5 years post-deletion (Tax Administration Act record-keeping),
-- while everything else (receipts/photos, mileage, bank accounts, home
-- office settings, profile PII, login) is still fully removed within 30
-- days. supabase/functions/purge-deleted-accounts is updated accordingly.
--
-- This requires keeping a PII-stripped profiles row alive after purge,
-- since expenses/income/receipts/tax_summary all CASCADE from profiles.id
-- (confirmed via information_schema — profiles itself has no FK to
-- auth.users, so deleting the auth user doesn't touch profiles). purged_at
-- marks that this tombstone row has already been through the 30-day purge,
-- so the daily sweep doesn't reprocess it, and anchors a future "delete
-- retained financial records after 5 years" job.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS purged_at timestamptz;

-- Extend the existing billing-fields trigger to also protect purged_at —
-- only the service-role purge function should ever set this.
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
  IF NEW.purged_at IS DISTINCT FROM OLD.purged_at THEN
    RAISE EXCEPTION 'purged_at is set only by the account-deletion purge process';
  END IF;

  RETURN NEW;
END;
$$;

NOTIFY pgrst, 'reload schema';
