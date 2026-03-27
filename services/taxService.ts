import { supabase } from '@/lib/supabase';
import type { TaxSummary } from '@/types/database';
import { expenseService } from './expenseService';

// ─── Tax Service ──────────────────────────────────────────────────────────────
// All Supabase database operations for tax summaries.
// Used by taxStore — do not call directly from screens.
// ─────────────────────────────────────────────────────────────────────────────

// SARS 2024/25 tax brackets (ZAR)
const TAX_BRACKETS = [
  { limit: 237100,   rate: 0.18, base: 0      },
  { limit: 370500,   rate: 0.26, base: 42678  },
  { limit: 512800,   rate: 0.31, base: 77362  },
  { limit: 673000,   rate: 0.36, base: 121475 },
  { limit: 857900,   rate: 0.39, base: 179147 },
  { limit: 1817000,  rate: 0.41, base: 251258 },
  { limit: Infinity, rate: 0.45, base: 644489 },
];

// ── Calculate tax on a given taxable income using SARS 2024/25 brackets ──────
const calculateTax = (taxableIncome: number): number => {
  if (taxableIncome <= 0) return 0;
  const bracket = TAX_BRACKETS.find((b) => taxableIncome <= b.limit)
    ?? TAX_BRACKETS[TAX_BRACKETS.length - 1];
  const prevLimit = TAX_BRACKETS[TAX_BRACKETS.indexOf(bracket) - 1]?.limit ?? 0;
  return bracket.base + (taxableIncome - prevLimit) * bracket.rate;
};

// ── Estimate the actual rand saving from a set of deductions ─────────────────
// Uses a conservative assumed gross income of R500,000 (middle of bracket 3)
// as a proxy when we don't know the user's actual income. The saving is the
// difference in tax liability with and without the deductions applied.
// A user in a higher bracket will see a larger saving in practice; this is
// the floor estimate, not a ceiling.
const ASSUMED_GROSS_INCOME = 500_000;

const estimateTaxSaving = (deductions: number): number => {
  if (deductions <= 0) return 0;
  const taxBefore = calculateTax(ASSUMED_GROSS_INCOME);
  const taxAfter  = calculateTax(Math.max(0, ASSUMED_GROSS_INCOME - deductions));
  return Math.round(taxBefore - taxAfter);
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
    const [totals, categoryBreakdown] = await Promise.all([
      expenseService.getTotals(userId, taxYear),
      expenseService.getByCategory(userId, taxYear),
    ]);

    const { totalExpenses, totalDeductions } = totals;
    const estTaxSaving = estimateTaxSaving(totalDeductions);
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
