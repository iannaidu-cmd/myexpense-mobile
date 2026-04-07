// ─── Database Types ───────────────────────────────────────────────────────────
// TypeScript interfaces matching every Supabase table.
// Import these instead of using 'any' for all database operations.
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  tax_number: string | null;
  work_type: string | null;
  active_tax_year: string;
  subscription: "free" | "pro" | "business";
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  vendor: string;
  amount: number;
  currency: string;
  category: string;
  itr12_code: string | null;
  tax_year: string;
  expense_date: string;
  is_deductible: boolean;
  vat_amount: number | null;
  notes: string | null;
  receipt_url: string | null;
  storage_path: string | null;
  ocr_raw: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  expense_id: string | null;
  storage_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  ocr_status: "pending" | "processing" | "done" | "failed";
  ocr_result: Record<string, unknown> | null;
  created_at: string;
}

export interface TaxSummary {
  id: string;
  user_id: string;
  tax_year: string;
  total_expenses: number;
  total_deductions: number;
  est_tax_saving: number;
  deduction_rate: number;
  itr12_readiness_pct: number;
  category_breakdown: Record<string, number> | null;
  last_calculated_at: string;
}

// ─── Form / input types ───────────────────────────────────────────────────────

export interface NewExpense {
  vendor: string;
  amount: number;
  category: string;
  itr12_code?: string | null;
  tax_year: string;
  expense_date: string;
  is_deductible?: boolean;
  vat_amount?: number;
  notes?: string;
  receipt_url?: string;
  storage_path?: string;
}

export interface UpdateExpense extends Partial<NewExpense> {
  id: string;
}

// ─── ITR12 Categories (SARS-aligned) ─────────────────────────────────────────

export const ITR12_CATEGORIES: Record<
  string,
  { code: string; section: string }
> = {
  "Travel & Transport": { code: "4011", section: "S11(a)" },
  "Home Office": { code: "4018", section: "S11(a)" },
  "Equipment & Tools": { code: "4022", section: "S11(e)" },
  "Software & Subscriptions": { code: "4011", section: "S11(a)" },
  "Professional Fees": { code: "4011", section: "S11(a)" },
  "Telephone & Internet": { code: "4011", section: "S11(a)" },
  "Marketing & Advertising": { code: "4011", section: "S11(a)" },
  "Bank Charges": { code: "4011", section: "S11(a)" },
  Utilities: { code: "4011", section: "S11(a)" },
  Entertainment: { code: "4011", section: "S11(a)" },
  Insurance: { code: "4011", section: "S11(a)" },
  "Other Deductible": { code: "4011", section: "S11(a)" },
  "Non-deductible": { code: "", section: "" },
};

export const CATEGORY_LIST = Object.keys(ITR12_CATEGORIES);

// ─── Tax years ────────────────────────────────────────────────────────────────

export const TAX_YEARS = ["2024/25", "2023/24", "2022/23", "2021/22"];
export const ACTIVE_TAX_YEAR = "2024/25";
