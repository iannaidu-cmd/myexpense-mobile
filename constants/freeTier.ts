// ─── Free-tier Usage Limit ────────────────────────────────────────────────────
// Free accounts get one shared allowance of uses, in total, across every
// limited feature. It never resets. Update here only - never hardcode the
// number in screens/services. Counted by services/freeUsageService.ts.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Free-tier cap: uses in total, shared and never reset. One use = one receipt
 * scan or upload, one expense added by hand, one mileage trip, one bank
 * import (however many transactions), one tax report export or one logbook
 * export. The next use after this goes to the paywall.
 */
export const FREE_USE_LIMIT = 12;

// Shared plain-language copy, so every screen describes the allowance the same way.
export const FREE_USES_SUMMARY =
  `The free plan gives you ${FREE_USE_LIMIT} free uses in total. ` +
  `Each receipt scan, expense, mileage trip, bank import or export uses one.`;

export const FREE_USES_DONE_TITLE = `You've used your ${FREE_USE_LIMIT} free uses`;

export const FREE_USES_DONE_MESSAGE =
  `Free accounts get ${FREE_USE_LIMIT} free uses in total, shared across scans, expenses, ` +
  `trips, bank imports and exports. Upgrade to Pro to keep going with no limits.`;

// AsyncStorage key for the one-off "you have N free uses" heads-up shown the
// first time a free user opens Scan. Shared by every scan entry point
// (scan-receipt-camera, upload-from-gallery) so it only ever shows once.
export const FREE_USES_NOTICE_KEY = "@myexpense:seen_free_uses_notice";
