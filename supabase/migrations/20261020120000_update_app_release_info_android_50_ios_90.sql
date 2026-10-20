-- The update banner on Home compares the installed build with this table.
-- It had not been updated since Android 47 / iOS 86, so nobody on a newer
-- build was told about 48, 49 or 50.
-- Android: 1.2.9 (versionCode 50) is live in Play Production.
-- iOS: 1.2.7 (build 90) is live on the App Store (1.2.8 / 1.2.9 in review).
update public.app_release_info
  set latest_build = 50, latest_version = '1.2.9', updated_at = now()
  where platform = 'android';

update public.app_release_info
  set latest_build = 90, latest_version = '1.2.7', updated_at = now()
  where platform = 'ios';
