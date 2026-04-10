import { supabase } from "@/lib/supabase";
import type { Expense, NewExpense, UpdateExpense } from "@/types/database";

// ─── Expense Service ──────────────────────────────────────────────────────────
// All Supabase database operations for expenses.
// Used by expenseStore — do not call directly from screens.
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpenseTotals {
  totalExpenses: number;
  totalDeductions: number;
  receiptCount: number;
}

export const expenseService = {
  // ── Get all expenses for a user + tax year ────────────────────────────────
  getExpenses: async (userId: string, taxYear: string): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .order("expense_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Get ALL expenses for a user (no tax year filter) ─────────────────────
  getAllExpenses: async (userId: string): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── Get recent expenses (for Home screen) ─────────────────────────────────
  getRecentExpenses: async (userId: string, limit = 10): Promise<Expense[]> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data ?? [];
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
    const { data, error } = await supabase
      .from("expenses")
      .select("amount, is_deductible")
      .eq("user_id", userId)
      .eq("tax_year", taxYear);

    if (error) throw new Error(error.message);

    const expenses = data ?? [];
    return {
      totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
      totalDeductions: expenses
        .filter((e) => e.is_deductible)
        .reduce((sum, e) => sum + Number(e.amount), 0),
      receiptCount: expenses.length,
    };
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
    return data;
  },

  // ── Delete an expense ─────────────────────────────────────────────────────
  deleteExpense: async (id: string): Promise<void> => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) throw new Error(error.message);
  },

  // ── Get expenses grouped by category ─────────────────────────────────────
  getByCategory: async (
    userId: string,
    taxYear: string,
  ): Promise<Record<string, number>> => {
    const { data, error } = await supabase
      .from("expenses")
      .select("category, amount")
      .eq("user_id", userId)
      .eq("tax_year", taxYear)
      .eq("is_deductible", true);

    if (error) throw new Error(error.message);

    return (data ?? []).reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    }, {});
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

    const { data: urlData } = supabase.storage
      .from("receipts")
      .getPublicUrl(storagePath);

    // Update expense with receipt_url
    await supabase
      .from("expenses")
      .update({ receipt_url: urlData.publicUrl })
      .eq("id", expenseId);

    // Insert receipt record
    await supabase.from("receipts").insert({
      user_id: userId,
      expense_id: expenseId,
      storage_path: storagePath,
      file_name: fileName,
      ocr_status: "pending",
    });

    return urlData.publicUrl;
  },
};
