import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

// ─── Profile Service ──────────────────────────────────────────────────────────
// All Supabase database operations for user profiles.
// ─────────────────────────────────────────────────────────────────────────────

export interface UpdateProfile {
  full_name?: string;
  tax_number?: string;
  work_type?: string;
  active_tax_year?: string;
  subscription?: 'free' | 'pro' | 'business';
}

export const profileService = {

  // ── Get profile by user id ────────────────────────────────────────────────
  getProfile: async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  },

  // ── Update profile ────────────────────────────────────────────────────────
  updateProfile: async (userId: string, updates: UpdateProfile): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ── Get or create profile ─────────────────────────────────────────────────
  getOrCreate: async (userId: string, email?: string): Promise<Profile> => {
    const existing = await profileService.getProfile(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
