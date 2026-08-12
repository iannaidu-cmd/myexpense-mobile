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
  /** "YYYY-MM-DD" — drives age-based rebate selection in lib/taxLiability.ts. */
  date_of_birth: string | null;
  medical_aid_monthly: number | null;
  medical_aid_dependants: number;
  has_disability: boolean;
  active_tax_year: string;
  subscription: "free" | "pro" | "business";
  is_dev_user: boolean;
  push_token: string | null;
  terms_accepted_at: string | null;
  /** Manually-granted comp access (e.g. "3 months free") — active while in the future. */
  promo_expires_at: string | null;
  /** Current RevenueCat entitlement expiry, synced by supabase/functions/revenuecat-webhook. */
  subscription_expires_at: string | null;
  /** Set when a renewal payment fails; cleared on the next successful renewal. Drives the 7-day access grace period. */
  billing_issue_detected_at: string | null;
  /** Set when the user requests account deletion; cleared if they cancel. supabase/functions/purge-deleted-accounts strips PII and revokes login 30 days after this is set. */
  deletion_requested_at: string | null;
  /** Set by purge-deleted-accounts once the 30-day purge has run — this row is now a PII-stripped tombstone kept alive only so retained expenses/income (which CASCADE from profiles.id) aren't lost. Anchors the eventual 5-year final-purge. */
  purged_at: string | null;
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

// SARS tax liability estimate (owed/refund) for a tax year — see
// lib/taxLiability.ts for the calculation engine and
// services/taxLiabilityService.ts for the Supabase read/write layer.
export interface TaxLiabilityEstimate {
  id: string;
  user_id: string;
  tax_year: string;
  other_taxable_income: number;
  retirement_annuity_contributions: number;
  tax_already_paid: number;
  donations_ytd: number | null;
  retirement_severance_lump_sum: number;
  prior_retirement_severance_lump_sums: number;
  taxable_income: number;
  gross_tax: number;
  rebates_applied: number;
  medical_credit_applied: number;
  lump_sum_tax: number;
  final_liability: number; // positive = owing, negative = refund
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface NewTaxLiabilityEstimate {
  tax_year: string;
  other_taxable_income: number;
  retirement_annuity_contributions: number;
  tax_already_paid: number;
  donations_ytd?: number | null;
  retirement_severance_lump_sum: number;
  prior_retirement_severance_lump_sums: number;
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
//
// Keys must exactly match constants/categories.ts CATEGORIES labels — this
// table used to carry its own shorter, drifted set of keys (missing Rent,
// Repairs & Maintenance, Vehicle Expenses, Training & Education, Interest &
// Finance Charges, and a "Non-deductible"/"Entertainment"/"Other Deductible"
// set that never matched any real category name), which meant CSV/PDF export
// silently fell back to a generic "Other" field for any expense in those
// categories instead of the correct SARS line.

export const ITR12_CATEGORIES: Record<
  string,
  { field: string; code: string; section: string }
> = {
  "Travel & Transport":         { field: "Travel Costs – Local",           code: "",     section: "S11(a) – Pg 11-12" },
  "Home Office":                { field: "Rental Paid",                    code: "",     section: "S11(a) – Pg 11-12" },
  "Equipment & Tools":          { field: "Depreciation",                   code: "",     section: "S11(e) – Pg 11-12" },
  "Software & Subscriptions":   { field: "Other",                          code: "",     section: "S11(a) – Pg 11-12" },
  "Meals & Entertainment":      { field: "Entertainment",                  code: "",     section: "S23(o) 80% – Pg 11-12" },
  "Professional Fees":          { field: "Consulting Fees Paid",           code: "",     section: "S11(a) – Pg 11-12" },
  Utilities:                    { field: "Electricity / Rates and Taxes",  code: "",     section: "S11(a) – Pg 11-12" },
  "Marketing & Advertising":    { field: "Other",                          code: "",     section: "S11(a) – Pg 11-12" },
  "Bank Charges":               { field: "Bank Charges",                   code: "",     section: "S11(a) – Pg 11-12" },
  "Interest & Finance Charges": { field: "Interest Paid – Other",          code: "",     section: "S11(a) – Pg 11-12" },
  Insurance:                    { field: "Insurance",                      code: "",     section: "S11(a) – Pg 11-12" },
  Rent:                         { field: "Rental Paid",                    code: "",     section: "S11(a) – Pg 11-12" },
  "Repairs & Maintenance":      { field: "Repairs",                        code: "",     section: "S11(a) – Pg 11-12" },
  "Training & Education":       { field: "Other",                          code: "",     section: "S11(a) – Pg 11-12" },
  "Telephone & Internet":       { field: "Telephone",                      code: "",     section: "S11(a) – Pg 11-12" },
  "Vehicle Expenses":           { field: "Motor Vehicle Expenses",         code: "",     section: "S11(a) – Pg 11-12" },
  "Retirement Annuity":         { field: "Total contributions",            code: "4006", section: "RA – Pg 23" },
  "Personal / Other":           { field: "",                               code: "",     section: "" },
};

export const CATEGORY_LIST = Object.keys(ITR12_CATEGORIES);

// ─── Tax years ────────────────────────────────────────────────────────────────
// ACTIVE_TAX_YEAR is derived from today's date (not hand-set) so it rolls over
// automatically every 1 March — see lib/taxRules.ts getCurrentTaxYear().

import { getCurrentTaxYear } from "@/lib/taxRules";

export const ACTIVE_TAX_YEAR = getCurrentTaxYear();

function recentTaxYears(count = 6): string[] {
  const startYear = parseInt(ACTIVE_TAX_YEAR.split("/")[0], 10);
  return Array.from({ length: count }, (_, i) => {
    const y = startYear - i;
    return `${y}/${String(y + 1).slice(-2)}`;
  });
}

export const TAX_YEARS = recentTaxYears();
