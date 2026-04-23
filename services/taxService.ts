import { supabase } from '@/lib/supabase';
import type { TaxSummary } from '@/types/database';
import { expenseService } from './expenseService';
import { incomeService } from './incomeService';

// ─── Tax Service ──────────────────────────────────────────────────────────────
// All Supabase database operations for tax summaries.
// Used by taxStore — do not call directly from screens.
// ─────────────────────────────────────────────────────────────────────────────

// SARS 2024/25 tax brackets (ZAR)
const TAX_BRACKETS = [
  { limit: 237100,  rate: 0.18, base: 0 },
  { limit: 370500,  rate: 0.26, base: 42678 },
  { limit: 512800,  rate: 0.31, base: 77362 },
  { limit: 673000,  rate: 0.36, base: 121475 },
  { limit: 857900,  rate: 0.39, base: 179147 },
  { limit: 1817000, rate: 0.41, base: 251258 },
  { limit: Infinity, rate: 0.45, base: 644489 },
];

function getMarginalRate(income: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.limit) return bracket.rate;
  }
  return 0.45;
}

const estimateTaxSaving = (deductions: number, income: number): number => {
  return Math.round(deductions * getMarginalRate(income));
};

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
      incomeService.getTotals(userId),
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
