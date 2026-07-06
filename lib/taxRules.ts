// SARS tax rules — update here each tax year, changes apply everywhere.

// Derive the SA tax year string (e.g. "2026/27") from any ISO date string.
// SA tax year runs 1 March → last day of February the following year.
export function taxYearForDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-indexed
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}/${String(startYear + 1).slice(-2)}`;
}

// The tax year in effect right now. Computed from the device clock (not a
// hardcoded string) so it rolls over automatically on 1 March every year —
// a hardcoded ACTIVE_TAX_YEAR previously went stale and mis-tagged every
// record created while it lagged (see 20260630000001_fix_expense_tax_years.sql).
export function getCurrentTaxYear(now: Date = new Date()): string {
  return taxYearForDate(now.toISOString());
}

export const TAX_YEAR = getCurrentTaxYear();

// SARS income tax brackets (ZAR) — 2026/27 (1 March 2026 – 28 February 2027).
// Unlike TAX_YEAR above, these figures can't be derived from the date — SARS
// publishes new rates each year (usually around the February Budget Speech)
// and this table must be updated by hand once they do, or estimates for the
// new tax year will silently use the prior year's brackets.
// Source: sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ (updated 25 Feb 2026)
export const TAX_BRACKETS = [
  { limit: 245100,   rate: 0.18, base: 0      },
  { limit: 383100,   rate: 0.26, base: 44118  },
  { limit: 530200,   rate: 0.31, base: 79998  },
  { limit: 695800,   rate: 0.36, base: 125599 },
  { limit: 887000,   rate: 0.39, base: 185215 },
  { limit: 1878600,  rate: 0.41, base: 259783 },
  { limit: Infinity, rate: 0.45, base: 666339 },
];

export function getMarginalRate(income: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.limit) return bracket.rate;
  }
  return 0.45;
}

export function estimateTaxSaving(deductions: number, income: number): number {
  return Math.round(deductions * getMarginalRate(income));
}

// SARS deemed mileage rate per km, by tax year. A fixed regulated figure SARS
// gazettes each year — not derivable from a formula like TAX_YEAR. Add the
// new year by hand once SARS publishes it, the same way TAX_BRACKETS above
// must be updated.
// A prior single hardcoded rate (R4.84) went stale after its year label was
// bumped forward without updating the number, silently mislabeling R4.84 as
// the "2025/26" rate when it was actually the correct 2024/25 figure.
export const SARS_MILEAGE_RATES: Record<string, number> = {
  "2026/27": 4.95, // effective 1 March 2026
  "2025/26": 4.76,
  "2024/25": 4.84,
};

// Rate for a specific tax year — use this (not SARS_RATE_PER_KM) whenever
// valuing an EXISTING trip or expense, so historical records keep using the
// rate that actually applied when they were logged instead of today's rate.
// Returns null for years before our records so callers can show "rate
// unknown" rather than silently applying the wrong figure.
export function mileageRateForTaxYear(taxYear: string): number | null {
  return SARS_MILEAGE_RATES[taxYear] ?? null;
}

// Current tax year's rate — only appropriate for a NEW trip being tracked
// right now. Falls back to the highest known rate if the current year hasn't
// been added to the table yet (rates only increase over time, so this is the
// least-wrong guess until the real figure is added).
export const SARS_RATE_PER_KM =
  mileageRateForTaxYear(getCurrentTaxYear()) ?? Math.max(...Object.values(SARS_MILEAGE_RATES));

// VAT rate
export const VAT_RATE = 0.15;

// TFSA (Tax Free Savings Account) limits — 2025/26
export const TFSA_ANNUAL_CAP = 36_000;    // annual contribution limit (updated from R33,000)
export const TFSA_LIFETIME_CAP = 500_000; // lifetime cap

// SBC (Small Business Corporation) tax thresholds — 2024/25
export const SBC_TURNOVER_LIMIT = 20_000_000; // qualifying turnover < R20M
export const SBC_BRACKETS = [
  { limit: 95_750,   rate: 0,    base: 0      },
  { limit: 365_000,  rate: 0.07, base: 0      },
  { limit: 550_000,  rate: 0.21, base: 18_848 },
  { limit: Infinity, rate: 0.27, base: 57_698 },
];

// S10(1)(o) foreign income exemption — 2025/26
export const FOREIGN_INCOME_EXEMPTION = 1_250_000; // first R1.25M exempt for qualifying employees
export const FOREIGN_DAYS_REQUIRED = 183;           // days outside SA in aggregate
export const FOREIGN_CONTINUOUS_DAYS = 60;          // consecutive days required
