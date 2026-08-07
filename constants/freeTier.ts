// ─── Free-tier Usage Limits ───────────────────────────────────────────────────
// "Strict hybrid" caps for non-paying users. Update here only — never
// hardcode these numbers in screens/services.
// ─────────────────────────────────────────────────────────────────────────────

/** Free-tier cap: OCR receipt scans per calendar month. */
export const FREE_SCAN_LIMIT = 20;

/** Free-tier cap: manually-entered expenses per calendar month. */
export const FREE_EXPENSE_LIMIT = 20;

/** Free-tier cap: saved mileage trips per calendar month. Previously Pro-only with zero free access. */
export const FREE_MILEAGE_TRIP_LIMIT = 20;

/** Free-tier cap: bank statement import sessions per calendar month. Previously Pro-only with zero free access. */
export const FREE_BANK_IMPORT_LIMIT = 20;

/** Free-tier cap: ITR12 exports per calendar month. Previously Pro-only with zero free access. */
export const FREE_ITR12_EXPORT_LIMIT = 20;

// AsyncStorage key for the "you have N free scans this month" heads-up shown
// the first time a free (non-premium) user opens Scan each calendar month —
// keyed by year-month so it naturally resets on its own every month, no
// cleanup job needed. Shared by every scan entry point (scan-receipt-camera,
// upload-from-gallery) so showing it from one marks it seen for the other.
export function scanAllowanceNoticeKey(date: Date = new Date()): string {
  const ym = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `@myexpense:seen_scan_allowance_notice:${ym}`;
}
