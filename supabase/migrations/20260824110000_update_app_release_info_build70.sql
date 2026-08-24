-- Build 70/versionCode 30 is the first release that actually ships the
-- update-checking feature (app_release_info + expo-application), so this
-- is the earliest point the row can meaningfully move past 69/29.
update public.app_release_info
  set latest_build = 70, latest_version = '1.0.5', updated_at = now()
  where platform = 'ios';

update public.app_release_info
  set latest_build = 30, latest_version = '1.0.5', updated_at = now()
  where platform = 'android';
