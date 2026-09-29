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
