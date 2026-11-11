import { CATEGORY_PARTIAL_CAPS } from "@/constants/categories";
import { getCached, invalidatePrefix, setCached } from "@/lib/queryCache";
import { supabase } from "@/lib/supabase";
import { claimableInputVat } from "@/lib/vat";
import { HOME_OFFICE_CATEGORY, setupClaimDescription, setupClaimForYear } from "@/lib/homeOffice";
import { homeOfficeService, type HomeOfficeSetting } from "@/services/homeOfficeService";
import type { Expense, NewExpense, UpdateExpense } from "@/types/database";

// Income-tax-deductible base of one expense row. A registered VAT vendor
// claims input VAT back separately (VAT201), so only the VAT they can
// actually claim comes off; VAT they can't claim (entertainment, or the
// private share of a partly-business cost) stays part of the cost (s23C).
// When the row was apportioned (business_use_pct), `amount` is already the
// business share, so only that share of the VAT comes off. The old rule
// subtracted the full VAT from the reduced amount and under-deducted.
export function deductibleBase(
  e: {
    amount: number | string;
    vat_amount?: number | string | null;
    business_use_pct?: number | string | null;
    category: string;
    is_deductible: boolean;
  },
  vatRegistered: boolean,
): number {
  if (!vatRegistered) return Number(e.amount);
  return Math.max(0, Number(e.amount) - claimableInputVat(e));
}

export interface HomeOfficeSetupClaim {
  /** Rands added to the Home Office claim from the setup screen (0 if none). */
  amount: number;
  /** "Home office setup: 10% of R 120 000 annual rent", or null when amount is 0. */
  description: string | null;
}

// Never fails the totals: without the setting there is simply no setup claim.
function loadHomeOfficeSetting(userId: string): Promise<HomeOfficeSetting | null> {
  return homeOfficeService.getSetting(userId).catch(() => null);
}

const isLoggedHomeOffice = (e: { category: string; is_deductible: boolean }) =>
  e.is_deductible && e.category === HOME_OFFICE_CATEGORY;

export interface ExpenseTotals {
  totalExpenses: number;
  totalDeductions: number;
  receiptCount: number;
}

export const expenseService = {
  // ── Get all expenses for a user + tax year ────────────────────────────────
  getExpenses: async (userId: string, taxYear: string): Promise<Expense[]> => {
    const key = `exp:all:${userId}:${taxYear}`;
    const cached = getCached<Expense[]>(key);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .order("expense_date", { ascending: false });

    if (error) throw new Error(error.message);
    const result = data ?? [];
    setCached(key, result);
    return result;
  },

  // ── Get ALL expenses for a user (no tax year filter) ─────────────────────
  getAllExpenses: async (userId: string): Promise<Expense[]> => {
    const key = `exp:all-years:${userId}`;
    const cached = getCached<Expense[]>(key);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });

    if (error) throw new Error(error.message);
    const result = data ?? [];
    setCached(key, result);
    return result;
  },

  // ── Get recent expenses (for Home screen) ─────────────────────────────────
  getRecentExpenses: async (userId: string, limit = 10): Promise<Expense[]> => {
    const key = `exp:recent:${userId}:${limit}`;
    const cached = getCached<Expense[]>(key);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    const result = data ?? [];
    setCached(key, result);
    return result;
  },

  // ── Get expenses with a receipt attached, within a date range ────────────
  // Used by the bulk receipt export (ZIP) — deliberately NOT cached since
  // date ranges are arbitrary and user-chosen, unlike the fixed tax-year keys above.
  getExpensesWithReceiptsInRange: async (
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .not("storage_path", "is", null)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .order("expense_date", { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Expense[];
  },

  // ── Get a single expense by id ────────────────────────────────────────────
  getExpenseById: async (id: string): Promise<Expense> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ── Get totals for a user + tax year ─────────────────────────────────────
  // `vatRegistered` should be the caller's profiles.vat_registered flag. A
  // registered VAT vendor claims input VAT back separately via VAT201, so
  // their income-tax-deductible amount excludes vat_amount — deducting the
  // gross figure would double-claim that VAT. An unregistered user cannot
  // reclaim VAT anywhere, so the gross amount is correctly the full
  // deduction for them (default/existing behaviour).
  getTotals: async (
    userId: string,
    taxYear: string,
    vatRegistered = false,
  ): Promise<ExpenseTotals> => {
    const key = `exp:totals:${userId}:${taxYear}:${vatRegistered ? 1 : 0}`;
    const cached = getCached<ExpenseTotals>(key);
    if (cached) return cached;

    const [{ data, error }, homeOffice] = await Promise.all([
      supabase
        .from("expenses")
        .select("amount, is_deductible, category, vat_amount, business_use_pct")
        .eq("user_id", userId)
        .eq("tax_year", taxYear),
      loadHomeOfficeSetting(userId),
    ]);

    if (error) throw new Error(error.message);

    const expenses = data ?? [];
    // Rent or bond interest entered on the Home office setup screen. Counts as
    // a deduction only (it isn't a logged expense or receipt) and carries no
    // claimable VAT. See lib/homeOffice.ts for the no-double-count rule.
    const setupClaim = setupClaimForYear(homeOffice, taxYear, expenses.filter(isLoggedHomeOffice).length);
    const result: ExpenseTotals = {
      totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      totalDeductions:
        expenses
          .filter((e) => e.is_deductible)
          .reduce((sum, e) => {
            const cap = CATEGORY_PARTIAL_CAPS[e.category] ?? 1;
            return sum + deductibleBase(e, vatRegistered) * cap;
          }, 0) + setupClaim,
      receiptCount: expenses.length,
    };
    setCached(key, result);
    return result;
  },

  // ── Add a new expense ─────────────────────────────────────────────────────
  addExpense: async (userId: string, expense: NewExpense): Promise<Expense> => {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        user_id: userId,
        vendor: expense.vendor,
        amount: expense.amount,
        currency: "ZAR",
        category: expense.category,
        itr12_code: expense.itr12_code ?? null,
        tax_year: expense.tax_year,
        expense_date: expense.expense_date,
        is_deductible: expense.is_deductible ?? false,
        vat_amount: expense.vat_amount ?? null,
        notes: expense.notes ?? null,
        receipt_url: expense.receipt_url ?? null,
        storage_path: expense.storage_path ?? null,
        gross_amount: expense.gross_amount ?? null,
        business_use_pct: expense.business_use_pct ?? null,
        vehicle_id: expense.vehicle_id ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    invalidatePrefix(`exp:`);
    return data;
  },

  // ── Update an expense ─────────────────────────────────────────────────────
  updateExpense: async (expense: UpdateExpense): Promise<Expense> => {
    const { id, ...fields } = expense;
    const { data, error } = await supabase
      .from("expenses")
      .update(fields)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    invalidatePrefix(`exp:`);
    return data;
  },

  // ── Delete an expense ─────────────────────────────────────────────────────
  deleteExpense: async (id: string): Promise<void> => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) throw new Error(error.message);
    invalidatePrefix(`exp:`);
  },

  // ── Remove duplicate expenses (same vendor + amount + date) ───────────────
  // Keeps the oldest record for each combination, deletes the rest.
  // Returns the number of duplicates removed.
  removeDuplicates: async (userId: string, taxYear: string): Promise<number> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("id, vendor, amount, gross_amount, expense_date, created_at")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    const expenses = data ?? [];

    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const e of expenses) {
      // Full amount: an apportioned row's amount is only the claimable share.
      const key = `${e.vendor}|${Number(e.gross_amount ?? e.amount).toFixed(2)}|${e.expense_date}`;
      if (seen.has(key)) {
        duplicateIds.push(e.id);
      } else {
        seen.add(key);
      }
    }

    if (duplicateIds.length === 0) return 0;

    const BATCH = 100;
    for (let i = 0; i < duplicateIds.length; i += BATCH) {
      const { error: delErr } = await supabase
        .from("expenses")
        .delete()
        .in("id", duplicateIds.slice(i, i + BATCH));
      if (delErr) throw new Error(delErr.message);
    }

    invalidatePrefix("exp:");
    return duplicateIds.length;
  },

  // ── Get expenses grouped by category ─────────────────────────────────────
  // See getTotals above for why `vatRegistered` changes the deductible base.
  getByCategory: async (
    userId: string,
    taxYear: string,
    vatRegistered = false,
  ): Promise<Record<string, number>> => {
    const key = `exp:bycat:${userId}:${taxYear}:${vatRegistered ? 1 : 0}`;
    const cached = getCached<Record<string, number>>(key);
    if (cached) return cached;

    const [{ data, error }, homeOffice] = await Promise.all([
      supabase
        .from("expenses")
        .select("category, amount, vat_amount, business_use_pct, is_deductible")
        .eq("user_id", userId)
        .eq("tax_year", taxYear)
        .eq("is_deductible", true),
      loadHomeOfficeSetting(userId),
    ]);

    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const result = rows.reduce<Record<string, number>>((acc, e) => {
      const cap = CATEGORY_PARTIAL_CAPS[e.category] ?? 1;
      acc[e.category] = (acc[e.category] ?? 0) + deductibleBase(e, vatRegistered) * cap;
      return acc;
    }, {});
    // Same rule as getTotals, so the categories always add up to the total.
    const setupClaim = setupClaimForYear(homeOffice, taxYear, rows.filter(isLoggedHomeOffice).length);
    if (setupClaim > 0) {
      result[HOME_OFFICE_CATEGORY] = (result[HOME_OFFICE_CATEGORY] ?? 0) + setupClaim;
    }
    setCached(key, result);
    return result;
  },

  // ── The Home Office amount that comes from the setup screen ──────────────
  // For labelling it on the export preview, category breakdown and PDF.
  getHomeOfficeSetupClaim: async (userId: string, taxYear: string): Promise<HomeOfficeSetupClaim> => {
    const [{ count, error }, homeOffice] = await Promise.all([
      supabase
        .from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tax_year", taxYear)
        .eq("is_deductible", true)
        .eq("category", HOME_OFFICE_CATEGORY),
      loadHomeOfficeSetting(userId),
    ]);
    if (error) throw new Error(error.message);
    const amount = setupClaimForYear(homeOffice, taxYear, count ?? 0);
    return { amount, description: amount > 0 && homeOffice ? setupClaimDescription(homeOffice) : null };
  },

  // ── Upload receipt and link to expense ────────────────────────────────────
  uploadReceipt: async (
    userId: string,
    expenseId: string,
    uri: string,
    fileName: string,
  ): Promise<string> => {
    const storagePath = `${userId}/${expenseId}/${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(storagePath, blob, { upsert: true });

    if (uploadError) throw new Error(uploadError.message);

    // Generate a short-lived signed URL for the caller to use for preview.
    // We never store public URLs — the bucket is private and access is always
    // via createSignedUrl using storage_path.
    const { data: signedData } = await supabase.storage
      .from("receipts")
      .createSignedUrl(storagePath, 60 * 60); // 1-hour preview TTL

    const signedUrl = signedData?.signedUrl ?? null;

    // Link the receipt to the expense (storage_path is the durable reference)
    await supabase
      .from("expenses")
      .update({ storage_path: storagePath, receipt_url: signedUrl })
      .eq("id", expenseId);

    // Insert receipt record
    await supabase.from("receipts").insert({
      user_id: userId,
      expense_id: expenseId,
      storage_path: storagePath,
      file_name: fileName,
      ocr_status: "pending",
    });

    return storagePath;
  },
};
