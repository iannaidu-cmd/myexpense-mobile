import { getCached, invalidatePrefix, setCached } from '@/lib/queryCache';
import { supabase } from '@/lib/supabase';

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
  tax_year: string;
  created_at: string;
}

export interface NewIncome {
  amount: number;
  source: string;
  category?: string;
  description?: string;
  date: string;
  tax_year: string;
}

export interface IncomeTotals {
  totalIncome: number;
  entryCount: number;
}

export const incomeService = {

  // ── Get income for a user, optionally scoped to one tax year ─────────────
  // Omit taxYear for an all-time view (e.g. income-history, cross-year charts).
  getIncome: async (userId: string, taxYear?: string): Promise<IncomeEntry[]> => {
    const key = `inc:all:${userId}:${taxYear ?? 'all'}`;
    const cached = getCached<IncomeEntry[]>(key);
    if (cached) return cached;

    let query = supabase.from('income').select('*').eq('user_id', userId);
    if (taxYear) query = query.eq('tax_year', taxYear);
    const { data, error } = await query.order('date', { ascending: false });

    if (error) throw new Error(error.message);
    const result = data ?? [];
    setCached(key, result);
    return result;
  },

  // ── Get recent income entries, optionally scoped to one tax year ─────────
  getRecentIncome: async (userId: string, limit = 5, taxYear?: string): Promise<IncomeEntry[]> => {
    const key = `inc:recent:${userId}:${limit}:${taxYear ?? 'all'}`;
    const cached = getCached<IncomeEntry[]>(key);
    if (cached) return cached;

    let query = supabase.from('income').select('*').eq('user_id', userId);
    if (taxYear) query = query.eq('tax_year', taxYear);
    const { data, error } = await query.order('date', { ascending: false }).limit(limit);

    if (error) throw new Error(error.message);
    const result = data ?? [];
    setCached(key, result);
    return result;
  },

  // ── Get income totals, optionally scoped to one tax year ─────────────────
  getTotals: async (userId: string, taxYear?: string): Promise<IncomeTotals> => {
    const key = `inc:totals:${userId}:${taxYear ?? 'all'}`;
    const cached = getCached<IncomeTotals>(key);
    if (cached) return cached;

    let query = supabase.from('income').select('amount').eq('user_id', userId);
    if (taxYear) query = query.eq('tax_year', taxYear);
    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const entries = data ?? [];
    const result: IncomeTotals = {
      totalIncome: entries.reduce((sum, e) => sum + Number(e.amount), 0),
      entryCount: entries.length,
    };
    setCached(key, result);
    return result;
  },

  // ── Add income entry ──────────────────────────────────────────────────────
  addIncome: async (userId: string, income: NewIncome): Promise<IncomeEntry> => {
    const { data, error } = await supabase
      .from('income')
      .insert({
        user_id: userId,
        amount: income.amount,
        source: income.source,
        category: income.category ?? null,
        description: income.description ?? null,
        date: income.date,
        tax_year: income.tax_year,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    invalidatePrefix(`inc:`);
    return data;
  },

  // ── Update an income entry ────────────────────────────────────────────────
  updateIncome: async (id: string, income: Partial<NewIncome>): Promise<IncomeEntry> => {
    const { data, error } = await supabase
      .from('income')
      .update({
        ...(income.amount !== undefined && { amount: income.amount }),
        ...(income.source !== undefined && { source: income.source }),
        ...(income.description !== undefined && { description: income.description ?? null }),
        ...(income.date !== undefined && { date: income.date }),
        ...(income.tax_year !== undefined && { tax_year: income.tax_year }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    invalidatePrefix(`inc:`);
    return data;
  },

  // ── Get a single income entry by id ──────────────────────────────────────
  getIncomeById: async (id: string): Promise<IncomeEntry> => {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .eq('id', id)
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
    invalidatePrefix(`inc:`);
  },

  // ── Get income grouped by source, optionally scoped to one tax year ──────
  getBySource: async (userId: string, taxYear?: string): Promise<Record<string, number>> => {
    const key = `inc:bysrc:${userId}:${taxYear ?? 'all'}`;
    const cached = getCached<Record<string, number>>(key);
    if (cached) return cached;

    let query = supabase.from('income').select('source, amount').eq('user_id', userId);
    if (taxYear) query = query.eq('tax_year', taxYear);
    const { data, error } = await query;

    if (error) throw new Error(error.message);

    const result = (data ?? []).reduce<Record<string, number>>((acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + Number(e.amount);
      return acc;
    }, {});
    setCached(key, result);
    return result;
  },
};
