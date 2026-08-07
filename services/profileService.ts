import { getCached, invalidatePrefix, setCached } from "@/lib/queryCache";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

// ─── Profile Service ──────────────────────────────────────────────────────────
// All Supabase database operations for user profiles.
// ─────────────────────────────────────────────────────────────────────────────

export interface UpdateProfile {
  full_name?: string;
  business_name?: string;
  phone?: string;
  tax_number?: string;
  work_type?: string;
  active_tax_year?: string;
  push_token?: string;
  terms_accepted_at?: string;
  /** The user's own choice about their own account — set to request deletion, null to cancel. */
  deletion_requested_at?: string | null;
  date_of_birth?: string | null;
  medical_aid_monthly?: number | null;
  medical_aid_dependants?: number;
  has_disability?: boolean;
}

export const profileService = {
  // ── Get profile by user id ────────────────────────────────────────────────
  getProfile: async (userId: string): Promise<Profile | null> => {
    const key = `profile:${userId}`;
    const cached = getCached<Profile>(key);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw new Error(error.message);
    const result = data ?? null;
    if (result) setCached(key, result, 120_000); // 2-min TTL — profile rarely changes
    return result;
  },

  // ── Update profile ────────────────────────────────────────────────────────
  updateProfile: async (
    userId: string,
    updates: UpdateProfile,
  ): Promise<Profile> => {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    invalidatePrefix(`profile:${userId}`);
    return data;
  },

  // ── Get or create profile ─────────────────────────────────────────────────
  getOrCreate: async (userId: string, email?: string): Promise<Profile> => {
    const existing = await profileService.getProfile(userId);
    if (existing) return existing;

    const { data, error } = await supabase
      .from("profiles")
      .insert({ id: userId })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
