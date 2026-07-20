-- Account deletion (30-day grace period), per the Terms/Privacy commitment:
-- "Upon deletion of your account, you will have 30 days to export your data
-- before it is permanently deleted." No deletion mechanism existed before
-- this — Settings only offered sign-out, which is also an App Store Review
-- Guideline 5.1.1(v) risk (apps with account creation must support in-app
-- account deletion).
--
-- deletion_requested_at is a normal user-writable column (the user's own
-- choice about their own row, same trust level as terms_accepted_at) — the
-- existing "auth.uid() = id" RLS policy on profiles already covers request
-- and cancel. Only the actual purge, 30 days later, needs elevated
-- privilege, so a scheduled job calls a service-role edge function instead.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Shared secret the purge function checks on each scheduled invocation,
-- stored in Vault rather than inlined into the cron job body. Rotate via:
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'account_deletion_secret'),
--     '<new value>'
--   );
-- and `npx supabase secrets set ACCOUNT_DELETION_SECRET=<same new value>`.
--
-- This migration was already applied against production with a real
-- generated value (immediately redacted from this file before commit, for
-- obvious reasons). If this migration is ever replayed against a fresh
-- environment, replace the placeholder below with a real secret first —
-- running it as-is would leave the cron job unable to authenticate.
select vault.create_secret('__SET_VIA_SUPABASE_SECRETS_SET__', 'account_deletion_secret')
where not exists (select 1 from vault.secrets where name = 'account_deletion_secret');

select cron.schedule(
  'purge-deleted-accounts-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://hhfbbbxgmovfpaziebsw.supabase.co/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'account_deletion_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
)
where not exists (select 1 from cron.job where jobname = 'purge-deleted-accounts-daily');
