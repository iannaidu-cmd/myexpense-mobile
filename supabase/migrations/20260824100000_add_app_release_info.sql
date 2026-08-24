-- Backs the in-app "update available" banner. The app reads the row for its
-- own platform and compares latest_build against the native build number
-- (expo-application's Application.nativeBuildVersion) — comparing build
-- numbers rather than version strings because this repo bumps buildNumber/
-- versionCode on every native release even when the marketing version
-- (expo.version) doesn't change, so it's the only value guaranteed to be
-- monotonically increasing.
--
-- No write policies are defined below, so only the service role (which
-- bypasses RLS) can update this table — anon/authenticated sessions can
-- read but never write, same protection pattern as protect_billing_fields.
--
-- After each future App Store / Play Store submission, update the row for
-- that platform, e.g.:
--   update public.app_release_info
--     set latest_build = 70, latest_version = '1.0.6', updated_at = now()
--     where platform = 'ios';
-- Run via the Supabase Studio SQL editor (service role) — there is no CLI
-- shortcut for this since it's data, not a schema migration.

create table if not exists public.app_release_info (
  platform text primary key check (platform in ('ios', 'android')),
  latest_build integer not null,
  latest_version text not null,
  store_url text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_release_info enable row level security;

create policy "app_release_info_select_all" on public.app_release_info
  for select using (true);

insert into public.app_release_info (platform, latest_build, latest_version, store_url)
values
  ('ios', 69, '1.0.5', 'https://apps.apple.com/app/id6781178596'),
  ('android', 29, '1.0.5', 'https://play.google.com/store/apps/details?id=co.za.myexpense.myapp')
on conflict (platform) do update
  set latest_build = excluded.latest_build,
      latest_version = excluded.latest_version,
      store_url = excluded.store_url,
      updated_at = now();

notify pgrst, 'reload schema';
