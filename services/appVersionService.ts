import { supabase } from '@/lib/supabase';
import type { AppReleaseInfo } from '@/types/database';

export const appVersionService = {
  // Returns null (not an error) when the platform has no row yet, so a
  // missing/misconfigured table never blocks app usage.
  getLatestRelease: async (platform: 'ios' | 'android'): Promise<AppReleaseInfo | null> => {
    const { data, error } = await supabase
      .from('app_release_info')
      .select('*')
      .eq('platform', platform)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  },
};
