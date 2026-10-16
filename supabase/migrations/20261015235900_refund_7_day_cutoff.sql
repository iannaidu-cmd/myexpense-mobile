-- Refunded users keep Pro for 7 days after the refund, then lose it.
-- (Users who cancel without a refund keep Pro until their paid period ends;
-- the revenuecat-webhook's EXPIRATION handling covers that, no job needed.)
--
-- Run in the Supabase SQL Editor on 2026-10-16 as cancel-cutoff-7-days.sql,
-- before the updated revenuecat-webhook was deployed (it writes refunded_at).
-- Must also run before 20261016000000_protect_refunded_at.sql, whose guard
-- references the column.

-- 1. Track when a user was refunded.
alter table public.profiles
  add column if not exists refunded_at timestamptz;

-- 2. Every 15 minutes, switch refunded users to free once their
--    7-day window (subscription_expires_at) has passed.
--    Dev users are left alone.
create extension if not exists pg_cron;

select cron.unschedule('expire-refunded-pro')
where exists (select 1 from cron.job where jobname = 'expire-refunded-pro');

select cron.schedule(
  'expire-refunded-pro',
  '*/15 * * * *',
  $$
  update public.profiles
     set subscription = 'free',
         subscription_expires_at = null,
         billing_issue_detected_at = null,
         refunded_at = null
   where subscription = 'pro'
     and refunded_at is not null
     and subscription_expires_at is not null
     and subscription_expires_at < now()
     and not coalesce(is_dev_user, false);
  $$
);
