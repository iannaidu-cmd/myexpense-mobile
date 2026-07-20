import { CATEGORY_PARTIAL_CAPS } from "@/constants/categories";
import { getCached, invalidatePrefix, setCached } from "@/lib/queryCache";
import { supabase } from "@/lib/supabase";
import type { Expense, NewExpense, UpdateExpense } from "@/types/database";

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
  getTotals: async (
    userId: string,
    taxYear: string,
  ): Promise<ExpenseTotals> => {
    const key = `exp:totals:${userId}:${taxYear}`;
    const cached = getCached<ExpenseTotals>(key);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("expenses")
      .select("amount, is_deductible, category")
      .eq("user_id", userId)
      .eq("tax_year", taxYear);

    if (error) throw new Error(error.message);

    const expenses = data ?? [];
    const result: ExpenseTotals = {
      totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      totalDeductions: expenses
        .filter((e) => e.is_deductible)
        .reduce((sum, e) => {
          const cap = CATEGORY_PARTIAL_CAPS[e.category] ?? 1;
          return sum + Number(e.amount) * cap;
        }, 0),
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
      .select("id, vendor, amount, expense_date, created_at")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    const expenses = data ?? [];

    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    for (const e of expenses) {
      const key = `${e.vendor}|${Number(e.amount).toFixed(2)}|${e.expense_date}`;
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
  getByCategory: async (
    userId: string,
    taxYear: string,
  ): Promise<Record<string, number>> => {
    const key = `exp:bycat:${userId}:${taxYear}`;
    const cached = getCached<Record<string, number>>(key);
    if (cached) return cached;

    const { data, error } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .eq("is_deductible", true);

    if (error) throw new Error(error.message);

    const result = (data ?? []).reduce<Record<string, number>>((acc, e) => {
      const cap = CATEGORY_PARTIAL_CAPS[e.category] ?? 1;
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount) * cap;
      return acc;
    }, {});
    setCached(key, result);
    return result;
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
