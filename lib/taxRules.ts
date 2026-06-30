// SARS tax rules — update here each tax year, changes apply everywhere.

export const TAX_YEAR = "2026/27";

// SARS income tax brackets (ZAR) — 2026/27 (1 March 2026 – 28 February 2027)
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

// SARS deemed mileage rate — 2026/27 (R4.95/km, effective 1 March 2026)
export const SARS_RATE_PER_KM = 4.95;

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
