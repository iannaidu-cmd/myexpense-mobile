// ─── Home office rules ───────────────────────────────────────────────────────
// Pure functions (no Supabase, no React) so they can be unit tested. Used by
// the setup screen, every expense entry point and the totals in expenseService.
// ─────────────────────────────────────────────────────────────────────────────
import type { HomeOfficeSetting } from "@/services/homeOfficeService";

export const HOME_OFFICE_CATEGORY = "Home Office";

/** Categories claimed at the home office floor percentage. */
export const HOME_OFFICE_CATS: readonly string[] = [HOME_OFFICE_CATEGORY, "Utilities", "Repairs & Maintenance"];

export function isHomeOfficeCategory(category: string | null | undefined): boolean {
  return !!category && HOME_OFFICE_CATS.includes(category);
}

/** Office m2 / total m2, capped at 1. 0 when there is no usable setup. */
export function floorRatio(s: HomeOfficeSetting | null): number {
  if (!s || s.totalM2 <= 0) return 0;
  return Math.min(s.officeM2 / s.totalM2, 1);
}

/** Annual rent or bond interest x floor ratio, whole rands. 0 for "none". */
export function annualDeductible(s: HomeOfficeSetting | null): number {
  if (!s || s.arrangementType === "none") return 0;
  return Math.round(s.annualCost * floorRatio(s));
}

/** gross x ratio, rounded to cents. */
export function apportion(gross: number, ratio: number): number {
  return Math.round((gross * ratio + Number.EPSILON) * 100) / 100;
}

/** ratio as the business_use_pct stored on an expense row (2 decimals). */
export function pctFromRatio(ratio: number): number {
  return Math.round((ratio * 100 + Number.EPSILON) * 100) / 100;
}

/** "10%" or "12.5%" for display. */
export function formatRatio(ratio: number): string {
  const pct = Math.round(ratio * 1000) / 10;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(1)}%`;
}

/**
 * The amount the setup screen adds to the Home Office claim for a tax year.
 *
 * One source only, so nothing is counted twice:
 * - If the user logged any deductible Home Office expenses that year, those
 *   are the claim (they have dates and receipts) and this returns 0.
 * - Otherwise the claim is annual cost x floor ratio, but only for the tax
 *   year the cost was entered for. A setup with no tax year (saved before
 *   the year was recorded) claims nothing until it is saved again.
 */
export function setupClaimForYear(
  setting: HomeOfficeSetting | null,
  taxYear: string,
  loggedHomeOfficeCount: number,
): number {
  if (!setting || !setting.costTaxYear || setting.costTaxYear !== taxYear) return 0;
  if (loggedHomeOfficeCount > 0) return 0;
  return annualDeductible(setting);
}

/** "Home office setup: 10% of R 120 000 annual rent" */
export function setupClaimDescription(setting: HomeOfficeSetting): string {
  const what = setting.arrangementType === "owned" ? "annual bond interest" : "annual rent";
  const rands = Math.round(setting.annualCost).toLocaleString("en-ZA");
  return `Home office setup: ${formatRatio(floorRatio(setting))} of R ${rands} ${what}`;
}
