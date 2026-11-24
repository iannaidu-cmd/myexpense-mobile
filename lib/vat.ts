// ─── VAT rules ────────────────────────────────────────────────────────────────
// One place for the VAT rules the VAT summary, Reports and income-tax totals
// share. Sources (checked 29 Sep 2026):
// • Thresholds: SARS FAQ "What is the new threshold for VAT registration?" and
//   Budget 2026 FAQs. From 1 April 2026, registration is compulsory above
//   R2.3 million of taxable supplies a year (was R1 million) and voluntary
//   above R120 000 (was R50 000).
// • Input tax: SARS VAT 404 Guide for Vendors (Issue 15).
//   - Only the business share of VAT can be claimed: "No VAT may be deducted
//     when goods or services are acquired for private purposes", and a
//     partly-business expense's VAT "must be apportioned" (§8.4.2).
//   - Entertainment VAT can't be claimed, "even if used for making taxable
//     supplies" (§8.5.1).
//   - A salaried employee isn't carrying on an enterprise, so salary isn't
//     turnover for the threshold.
// Re-check these when SARS publishes a new VAT 404 issue or Budget.
// ─────────────────────────────────────────────────────────────────────────────

import { VAT_RATE } from "./taxRules";

export const VAT_COMPULSORY_THRESHOLD = 2_300_000;
export const VAT_VOLUNTARY_THRESHOLD = 120_000;

// Expense categories where the app saves only a business share of the cost
// (see add-expense-manual.tsx / receipt-review.tsx).
export const APPORTIONED_CATEGORIES = [
  "Telephone & Internet",
  "Home Office",
  "Utilities",
  "Repairs & Maintenance",
  "Insurance",
  "Interest & Finance Charges",
  "Vehicle Expenses",
];

// VAT on entertainment is never claimable (VAT 404 §8.5.1).
export const NO_INPUT_VAT_CATEGORIES = ["Meals & Entertainment"];

interface VatExpense {
  amount: number | string;
  vat_amount?: number | string | null;
  business_use_pct?: number | string | null;
  category: string;
  is_deductible: boolean;
}

// Input VAT a registered vendor can claim back on this expense.
export function claimableInputVat(e: VatExpense): number {
  if (!e.is_deductible || NO_INPUT_VAT_CATEGORIES.includes(e.category)) return 0;
  const share = e.business_use_pct != null ? Number(e.business_use_pct) / 100 : 1;
  return Math.max(Number(e.vat_amount ?? 0) * share, 0);
}

// Saved before the app kept the business-use % (29 Sep 2026), in a category
// where only part of the cost counts. Its VAT may be overstated, and we can't
// tell by how much, so it's flagged for the user to check.
export function vatNeedsReview(e: VatExpense): boolean {
  return (
    e.is_deductible &&
    Number(e.vat_amount ?? 0) > 0 &&
    e.business_use_pct == null &&
    APPORTIONED_CATEGORIES.includes(e.category)
  );
}

// ─── VAT on income (output tax) ──────────────────────────────────────────────
// A vendor's local payments include VAT; foreign (exported) services are
// zero-rated and don't (VAT 404 §6). So it's chosen per entry, not from the
// vendor's status. income.amount is what was received; vat_amount is the VAT
// inside it. Only the amount without VAT is income for income tax and
// turnover for the VAT threshold.

/** VAT inside a VAT-inclusive amount: amount × 15/115, to the cent. */
export function vatInInclusive(amount: number): number {
  if (!(amount > 0)) return 0;
  return Math.round(((amount * VAT_RATE) / (1 + VAT_RATE)) * 100) / 100;
}

interface VatIncome {
  amount: number | string;
  vat_amount?: number | string | null;
}

/** VAT charged (output tax) on this income entry. */
export function incomeVat(i: VatIncome): number {
  return Math.max(Number(i.vat_amount ?? 0), 0);
}

/** The income amount without VAT, used for every tax total. */
export function incomeExVat(i: VatIncome): number {
  return Number(i.amount) - incomeVat(i);
}

// Last "Includes VAT" choice on add income / bank import, so a vendor whose
// payments are mostly local (or mostly from overseas) rarely changes it.
export const INCOME_INCLUDES_VAT_LAST_KEY = "@myexpense:income_includes_vat_last";

// Tax year whose income VAT vendors are asked to check once: entries saved
// before income could hold VAT may include VAT they never took off.
export const INCOME_VAT_CHECK_TAX_YEAR = "2025/26";

// Income that isn't business turnover for the VAT threshold: employment
// income (IRP5, salary, allowances) and the app's automatic vehicle-sale row.
export function countsTowardVatTurnover(i: {
  source?: string | null;
  category?: string | null;
  recoupment_vehicle_id?: string | null;
}): boolean {
  if (i.recoupment_vehicle_id) return false;
  const text = `${i.source ?? ""} ${i.category ?? ""}`;
  return !/IRP5|Employment|Salary|Wage|Bonus|Overtime|Fringe|Allowance/i.test(text);
}
