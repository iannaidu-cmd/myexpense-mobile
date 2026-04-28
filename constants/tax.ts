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
