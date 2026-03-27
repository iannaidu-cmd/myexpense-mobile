import { supabase } from '@/lib/supabase';
import { ACTIVE_TAX_YEAR } from '@/types/database';

// ─── Income Service ───────────────────────────────────────────────────────────
// All Supabase database operations for income.
// ─────────────────────────────────────────────────────────────────────────────

export interface IncomeEntry {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  source: string;
  category: string | null;
  date: string;
  created_at: string;
}

export interface NewIncome {
  amount: number;
  source: string;
  description?: string;
  category?: string;
  date: string;
}

export interface IncomeTotals {
  totalIncome: number;
  entryCount: number;
}

export const incomeService = {

  // ── Get all income for a user ─────────────────────────────────────────────
  getIncome: async (userId: string): Promise<IncomeEntry[]> => {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Get recent income entries ─────────────────────────────────────────────
  getRecentIncome: async (userId: string, limit = 5): Promise<IncomeEntry[]> => {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Get income totals ─────────────────────────────────────────────────────
  getTotals: async (userId: string): Promise<IncomeTotals> => {
    const { data, error } = await supabase
      .from('income')
      .select('amount')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    const entries = data ?? [];
    return {
      totalIncome: entries.reduce((sum, e) => sum + Number(e.amount), 0),
      entryCount: entries.length,
    };
  },

  // ── Add income entry ──────────────────────────────────────────────────────
  addIncome: async (userId: string, income: NewIncome): Promise<IncomeEntry> => {
    const { data, error } = await supabase
      .from('income')
      .insert({
        user_id: userId,
        amount: income.amount,
        source: income.source,
        description: income.description ?? null,
        date: income.date,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ── Delete income entry ───────────────────────────────────────────────────
  deleteIncome: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ── Get income grouped by source ──────────────────────────────────────────
  getBySource: async (userId: string): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from('income')
      .select('source, amount')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return (data ?? []).reduce<Record<string, number>>((acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + Number(e.amount);
      return acc;
    }, {});
  },
};
