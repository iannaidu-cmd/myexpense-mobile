import { apportion, HOME_OFFICE_CATS, pctFromRatio } from '@/lib/homeOffice';
import { getCached, invalidatePrefix, setCached } from '@/lib/queryCache';
import { supabase } from '@/lib/supabase';

// ─── Home Office Service ──────────────────────────────────────────────────────
// All Supabase database operations for the home-office deduction setting.
// ─────────────────────────────────────────────────────────────────────────────

export type ArrangementType = 'owned' | 'renting' | 'none';

export interface HomeOfficeSetting {
  officeM2: number;
  totalM2: number;
  arrangementType: ArrangementType;
  /** Annual rent (monthly x 12) or annual bond interest. */
  annualCost: number;
  /** Tax year the annual cost is for, e.g. "2026/27". Null on rows saved
   *  before this was recorded: those claim nothing until saved again. */
  costTaxYear: string | null;
}

/** Expenses the floor percentage can be (re)applied to. */
export interface ReapplyCandidates {
  /** Rows with a stored business_use_pct that differs from the new one. */
  updatable: { id: string; amount: number; gross_amount: number | null }[];
  /** Rows saved before the percentage was stored (no business_use_pct).
   *  Their amount may already be reduced, so they are never changed here. */
  unknownCount: number;
}

// Cached under the exp: prefix so it is cleared with the expense totals.
const settingKey = (userId: string) => `exp:homeoffice:${userId}`;

export const homeOfficeService = {

  // ── Get the user's home office setting (one row per user, or none) ──────
  getSetting: async (userId: string): Promise<HomeOfficeSetting | null> => {
    const key = settingKey(userId);
    const cached = getCached<{ v: HomeOfficeSetting | null }>(key);
    if (cached) return cached.v;

    const { data, error } = await supabase
      .from('home_office_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const setting: HomeOfficeSetting | null = data
      ? {
          officeM2: Number(data.office_m2),
          totalM2: Number(data.total_m2),
          arrangementType: data.arrangement_type,
          annualCost: Number(data.annual_cost),
          costTaxYear: data.cost_tax_year ?? null,
        }
      : null;
    setCached(key, { v: setting });
    return setting;
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
          cost_tax_year: setting.costTaxYear,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) throw new Error(error.message);
    // The setup cost feeds the expense totals.
    invalidatePrefix('exp:');
  },

  // ── Remove the user's home office setting ────────────────────────────────
  deleteSetting: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('home_office_settings')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    invalidatePrefix('exp:');
  },

  // ── Expenses in a tax year that a new floor ratio would change ──────────
  getReapplyCandidates: async (userId: string, taxYear: string, ratio: number): Promise<ReapplyCandidates> => {
    const { data, error } = await supabase
      .from('expenses')
      .select('id, amount, gross_amount, business_use_pct')
      .eq('user_id', userId)
      .eq('tax_year', taxYear)
      .eq('is_deductible', true)
      .in('category', [...HOME_OFFICE_CATS]);

    if (error) throw new Error(error.message);
    const pct = pctFromRatio(ratio);
    const rows = data ?? [];
    return {
      updatable: rows
        .filter((r) => r.business_use_pct != null && Number(r.business_use_pct) !== pct)
        .map((r) => ({
          id: r.id,
          amount: Number(r.amount),
          gross_amount: r.gross_amount != null ? Number(r.gross_amount) : null,
        })),
      unknownCount: rows.filter((r) => r.business_use_pct == null).length,
    };
  },

  // ── Apply a floor ratio to existing home office expenses ────────────────
  // Only rows with a stored business_use_pct (see ReapplyCandidates). Returns
  // how many were updated.
  reapplyRatio: async (userId: string, taxYear: string, ratio: number): Promise<number> => {
    const { updatable } = await homeOfficeService.getReapplyCandidates(userId, taxYear, ratio);
    const pct = pctFromRatio(ratio);
    const BATCH = 25;
    let updated = 0;
    try {
      for (let i = 0; i < updatable.length; i += BATCH) {
        const results = await Promise.all(
          updatable.slice(i, i + BATCH).map((row) => {
            const base = row.gross_amount ?? row.amount;
            return supabase
              .from('expenses')
              .update({ amount: apportion(base, ratio), gross_amount: base, business_use_pct: pct })
              .eq('id', row.id)
              .eq('user_id', userId);
          }),
        );
        const failed = results.find((r) => r.error);
        if (failed?.error) throw new Error(failed.error.message);
        updated += results.length;
      }
    } finally {
      invalidatePrefix('exp:');
    }
    return updated;
  },
};
