-- 1.2.6 (versionCode 47) cleared Google review and is live in Play Production.
-- iOS row stays at 86 / 1.2.3 until App Store Connect is checked.
update public.app_release_info
  set latest_build = 47, latest_version = '1.2.6', updated_at = now()
  where platform = 'android';
