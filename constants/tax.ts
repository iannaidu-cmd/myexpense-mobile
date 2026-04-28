// ─── Tax Constants ────────────────────────────────────────────────────────────
// SARS-specific rates and thresholds used across screens and services.
// Update here when SARS publishes new rates — never hardcode in screens.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimated marginal income-tax rate used for "tax saving" estimates.
 * Approximates the average effective rate for a South African sole trader
 * earning a mid-range income (SARS 2024/25 tables).
 * This is a display estimate only — not used for legal/accounting purposes.
 */
export const SA_MARGINAL_TAX_RATE = 0.31;

// SARS 2024/25 Medical Aid Tax Credit (MTC) rates — Section 6A of the Income Tax Act.
// Main member: R364/month, each dependant: R246/month. Multiply by 12 for annual credit.
export const MTC_MAIN_MONTHLY = 364;
export const MTC_DEPENDANT_MONTHLY = 246;

/**
 * Calculates the annual Medical Aid Tax Credit (S6A).
 * @param dependants Number of dependants (0 for member only).
 */
export function calculateAnnualMTC(dependants: number): number {
  return Math.round((MTC_MAIN_MONTHLY + dependants * MTC_DEPENDANT_MONTHLY) * 12);
}
