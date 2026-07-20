import { supabase } from '@/lib/supabase';
import { estimateTaxSaving } from '@/lib/taxRules';
import type { TaxSummary } from '@/types/database';
import { expenseService } from './expenseService';
import { incomeService } from './incomeService';

export const taxService = {

  // ── Get tax summary for a user + tax year ────────────────────────────────
  getTaxSummary: async (userId: string, taxYear: string): Promise<TaxSummary | null> => {
    const { data, error } = await supabase
      .from('tax_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('tax_year', taxYear)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  },

  // ── Recalculate and upsert tax summary ───────────────────────────────────
  recalculateSummary: async (userId: string, taxYear: string): Promise<TaxSummary> => {
    // Pull live data from expenses and income
    const [totals, categoryBreakdown, incomeTotals] = await Promise.all([
      expenseService.getTotals(userId, taxYear),
      expenseService.getByCategory(userId, taxYear),
      incomeService.getTotals(userId, taxYear),
    ]);

    const { totalExpenses, totalDeductions } = totals;
    const estTaxSaving = estimateTaxSaving(totalDeductions, incomeTotals.totalIncome);
    const deductionRate = totalExpenses > 0
      ? Math.round((totalDeductions / totalExpenses) * 100)
      : 0;

    // ITR12 readiness: percentage of expenses that have a receipt
    const { data: expensesWithReceipts } = await supabase
      .from('expenses')
      .select('id, receipt_url')
      .eq('user_id', userId)
      .eq('tax_year', taxYear);

    const allExpenses = expensesWithReceipts ?? [];
    const withReceipt = allExpenses.filter((e) => e.receipt_url).length;
    const itr12ReadinessPct = allExpenses.length > 0
      ? Math.round((withReceipt / allExpenses.length) * 100)
      : 0;

    const summary = {
      user_id: userId,
      tax_year: taxYear,
      total_expenses: totalExpenses,
      total_deductions: totalDeductions,
      est_tax_saving: estTaxSaving,
      deduction_rate: deductionRate,
      itr12_readiness_pct: itr12ReadinessPct,
      category_breakdown: categoryBreakdown,
      last_calculated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('tax_summary')
      .upsert(summary, { onConflict: 'user_id,tax_year' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ── Get all tax summaries across years (for history view) ─────────────────
  getAllSummaries: async (userId: string): Promise<TaxSummary[]> => {
    const { data, error } = await supabase
      .from('tax_summary')
      .select('*')
      .eq('user_id', userId)
      .order('tax_year', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Get or create summary (used on dashboard load) ────────────────────────
  getOrCreate: async (userId: string, taxYear: string): Promise<TaxSummary> => {
    const existing = await taxService.getTaxSummary(userId, taxYear);
    if (existing) return existing;
    return taxService.recalculateSummary(userId, taxYear);
  },
};
