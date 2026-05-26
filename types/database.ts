// ─── Database Types ───────────────────────────────────────────────────────────
// TypeScript interfaces matching every Supabase table.
// Import these instead of using 'any' for all database operations.
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  tax_number: string | null;
  work_type: string | null;
  active_tax_year: string;
  subscription: "free" | "pro" | "business";
  is_dev_user: boolean;
  push_token: string | null;
  terms_accepted_at: string | null;
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
// field: the exact label used in the eFiling Local Business Income section (Pg 11-12).
// code:  only set where SARS assigns a standalone source code outside that section.
// For sole proprietors all expenditure goes into the Local Business schedule;
// individual line items are named fields, not coded. Only the net taxable
// profit/loss carries a code (4222/4223, calculated by SARS).

export const ITR12_CATEGORIES: Record<
  string,
  { field: string; code: string; section: string }
> = {
  "Travel & Transport":       { field: "Travel Costs – Local",           code: "",     section: "S11(a) – Pg 11-12" },
  "Home Office":              { field: "Rental Paid",                    code: "",     section: "S11(a) – Pg 11-12" },
  "Equipment & Tools":        { field: "Depreciation",                   code: "",     section: "S11(e) – Pg 11-12" },
  "Software & Subscriptions": { field: "Other",                          code: "",     section: "S11(a) – Pg 11-12" },
  "Professional Fees":        { field: "Consulting Fees Paid",           code: "",     section: "S11(a) – Pg 11-12" },
  "Telephone & Internet":     { field: "Telephone",                      code: "",     section: "S11(a) – Pg 11-12" },
  "Marketing & Advertising":  { field: "Other",                          code: "",     section: "S11(a) – Pg 11-12" },
  "Bank Charges":             { field: "Bank Charges",                   code: "",     section: "S11(a) – Pg 11-12" },
  Utilities:                  { field: "Electricity / Rates and Taxes",  code: "",     section: "S11(a) – Pg 11-12" },
  Entertainment:              { field: "Entertainment",                  code: "",     section: "S23(o) 80% – Pg 11-12" },
  Insurance:                  { field: "Insurance",                      code: "",     section: "S11(a) – Pg 11-12" },
  "Meals & Entertainment":    { field: "Entertainment",                  code: "",     section: "S23(o) 80% – Pg 11-12" },
  "Retirement Annuity":       { field: "Total contributions",            code: "4006", section: "RA – Pg 23" },
  "Other Deductible":         { field: "Other",                          code: "",     section: "S11(a) – Pg 11-12" },
  "Non-deductible":           { field: "",                               code: "",     section: "" },
};

export const CATEGORY_LIST = Object.keys(ITR12_CATEGORIES);

// ─── Tax years ────────────────────────────────────────────────────────────────

export const TAX_YEARS = ["2024/25", "2023/24", "2022/23", "2021/22"];
export const ACTIVE_TAX_YEAR = "2024/25";
