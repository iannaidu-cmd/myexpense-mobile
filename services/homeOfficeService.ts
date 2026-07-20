import { supabase } from '@/lib/supabase';

// ─── Home Office Service ──────────────────────────────────────────────────────
// All Supabase database operations for the home-office deduction setting.
// ─────────────────────────────────────────────────────────────────────────────

export type ArrangementType = 'owned' | 'renting' | 'none';

export interface HomeOfficeSetting {
  officeM2: number;
  totalM2: number;
  arrangementType: ArrangementType;
  annualCost: number;
}

export const homeOfficeService = {

  // ── Get the user's home office setting (one row per user, or none) ──────
  getSetting: async (userId: string): Promise<HomeOfficeSetting | null> => {
    const { data, error } = await supabase
      .from('home_office_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    return {
      officeM2: Number(data.office_m2),
      totalM2: Number(data.total_m2),
      arrangementType: data.arrangement_type,
      annualCost: Number(data.annual_cost),
    };
  },

  // ── Create or replace the user's home office setting ────────────────────
  saveSetting: async (userId: string, setting: HomeOfficeSetting): Promise<void> => {
    const { error } = await supabase
      .from('home_office_settings')
      .upsert(
        {
          user_id: userId,
          office_m2: setting.officeM2,
          total_m2: setting.totalM2,
          arrangement_type: setting.arrangementType,
          annual_cost: setting.annualCost,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) throw new Error(error.message);
  },

  // ── Remove the user's home office setting ────────────────────────────────
  deleteSetting: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('home_office_settings')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },
};
