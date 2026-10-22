-- iOS 1.2.9 (build 92) is now live on the App Store. The 20 Oct update left
-- iOS at 90 / 1.2.7 because 1.2.9 was still in review, so iPhone users on
-- build 90 weren't being shown the update banner.
update public.app_release_info
  set latest_build = 92, latest_version = '1.2.9', updated_at = now()
  where platform = 'ios';
