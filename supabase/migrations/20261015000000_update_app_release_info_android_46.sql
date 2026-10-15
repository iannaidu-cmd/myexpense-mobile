-- 1.2.5 (versionCode 46) has been live in Play Production since 13 Oct.
-- 1.2.6 (47) is still in review, so don't point Android users at it yet.
-- iOS row stays at 86 / 1.2.3 until App Store Connect is checked.
update public.app_release_info
  set latest_build = 46, latest_version = '1.2.5', updated_at = now()
  where platform = 'android';
