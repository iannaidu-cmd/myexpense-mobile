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

export interface TaxBracket { limit: number; rate: number; base: number }
export interface RebateSchedule { primary: number; secondary: number; tertiary: number }
export interface MedicalCreditRates {
  taxpayerOrSoleDependant: number;  // monthly — taxpayer alone, or taxpayer + first dependant if no other member
  taxpayerPlusOneDependant: number; // monthly — combined rate for taxpayer + one dependant
  additionalDependant: number;      // monthly — each dependant beyond the first
}
export interface YearTaxData {
  brackets: TaxBracket[];
  rebates: RebateSchedule;
  thresholds: { under65: number; from65: number; from75: number };
  medicalCredit: MedicalCreditRates;
  raDeductionAnnualCap: number; // absolute S11F cap, Rand
}

// Full SARS constants by tax year — brackets, rebates, thresholds, medical
// scheme fees tax credit rates, and the S11F retirement annuity deduction
// cap. Unlike TAX_YEAR above, none of this can be derived from the date —
// SARS publishes new figures each year (usually around the February Budget
// Speech) and this table must be updated by hand once they do, or estimates
// for the new tax year will silently use the prior year's figures.
// Source: sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals and
// sars.gov.za/tax-rates/medical-tax-credit-rates — verified 2 Aug 2026.
// Re-verify against the live SARS pages and add the new year by hand after
// each Budget Speech before relying on it in-app — do not carry figures
// forward from memory once a new Speech has been delivered.
export const TAX_DATA_BY_YEAR: Record<string, YearTaxData> = {
  "2026/27": {
    brackets: [
      { limit: 245100,   rate: 0.18, base: 0      },
      { limit: 383100,   rate: 0.26, base: 44118  },
      { limit: 530200,   rate: 0.31, base: 79998  },
      { limit: 695800,   rate: 0.36, base: 125599 },
      { limit: 887000,   rate: 0.39, base: 185215 },
      { limit: 1878600,  rate: 0.41, base: 259783 },
      { limit: Infinity, rate: 0.45, base: 666339 },
    ],
    rebates: { primary: 17820, secondary: 9765, tertiary: 3249 },
    thresholds: { under65: 99000, from65: 153250, from75: 171300 },
    medicalCredit: { taxpayerOrSoleDependant: 376, taxpayerPlusOneDependant: 752, additionalDependant: 254 },
    raDeductionAnnualCap: 430000,
  },
  "2025/26": {
    brackets: [
      { limit: 237100,   rate: 0.18, base: 0      },
      { limit: 370500,   rate: 0.26, base: 42678  },
      { limit: 512800,   rate: 0.31, base: 77362  },
      { limit: 673000,   rate: 0.36, base: 121475 },
      { limit: 857900,   rate: 0.39, base: 179147 },
      { limit: 1817000,  rate: 0.41, base: 251258 },
      { limit: Infinity, rate: 0.45, base: 644489 },
    ],
    rebates: { primary: 17235, secondary: 9444, tertiary: 3145 },
    thresholds: { under65: 95750, from65: 148217, from75: 165689 },
    medicalCredit: { taxpayerOrSoleDependant: 364, taxpayerPlusOneDependant: 728, additionalDependant: 246 },
    raDeductionAnnualCap: 350000,
  },
};

function latestKnownTaxYear(): string {
  return Object.keys(TAX_DATA_BY_YEAR).sort().reverse()[0];
}

// Look up a year's full constants, falling back to the newest known year if
// the requested year hasn't been added to the table yet (SARS brackets only
// ever move in the taxpayer's favour year over year, so this is the
// least-wrong guess — same fallback pattern as SARS_RATE_PER_KM below).
export function taxDataForYear(taxYear: string): YearTaxData {
  return TAX_DATA_BY_YEAR[taxYear] ?? TAX_DATA_BY_YEAR[latestKnownTaxYear()];
}

// Kept for backward compatibility — every existing caller of TAX_BRACKETS
// wants "the current year's brackets" and none pass a tax year explicitly.
// Physically derived from TAX_DATA_BY_YEAR so there is exactly one copy of
// each year's figures, not two that can drift apart.
export const TAX_BRACKETS = TAX_DATA_BY_YEAR["2026/27"].brackets;

export function getMarginalRate(income: number): number {
  for (const bracket of TAX_BRACKETS) {
    if (income <= bracket.limit) return bracket.rate;
  }
  return 0.45;
}

// Per-year marginal rate — use this (not getMarginalRate) for any
// calculation that must respect a specific, possibly-non-current tax year,
// e.g. the tax liability engine in lib/taxLiability.ts.
export function getMarginalRateForYear(income: number, taxYear: string): number {
  const { brackets } = taxDataForYear(taxYear);
  for (const bracket of brackets) {
    if (income <= bracket.limit) return bracket.rate;
  }
  return brackets[brackets.length - 1].rate;
}

export function estimateTaxSaving(deductions: number, income: number): number {
  return Math.round(deductions * getMarginalRate(income));
}

// S6A medical scheme fees tax credit for a given tax year — a fixed monthly
// amount for the taxpayer (or taxpayer + first dependant if there's exactly
// one), a combined rate for taxpayer + one dependant, and a flat amount per
// additional dependant, annualised (×12).
export function medicalTaxCreditForYear(numDependants: number, taxYear: string): number {
  const { medicalCredit } = taxDataForYear(taxYear);
  const annual = (monthly: number) => monthly * 12;
  if (numDependants <= 0) return annual(medicalCredit.taxpayerOrSoleDependant);
  if (numDependants === 1) return annual(medicalCredit.taxpayerPlusOneDependant);
  return annual(medicalCredit.taxpayerPlusOneDependant) + (numDependants - 1) * annual(medicalCredit.additionalDependant);
}

// S11F retirement annuity deduction cap for a given tax year: the lesser of
// 27.5% of the greater of remuneration or taxable income, and the year's
// absolute Rand cap. Caller is responsible for passing
// max(remuneration, pre-RA taxable income) per SARS's own rule.
export function raDeductionCap(incomeForCapPurposes: number, taxYear: string): number {
  const { raDeductionAnnualCap } = taxDataForYear(taxYear);
  return Math.min(Math.round(incomeForCapPurposes * 0.275), raDeductionAnnualCap);
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
