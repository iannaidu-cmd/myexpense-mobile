// SARS tax rules — update here each tax year, changes apply everywhere.

export const TAX_YEAR = "2024/25";

// SARS income tax brackets (ZAR) — 2024/25
export const TAX_BRACKETS = [
  { limit: 237100,   rate: 0.18, base: 0      },
  { limit: 370500,   rate: 0.26, base: 42678  },
  { limit: 512800,   rate: 0.31, base: 77362  },
  { limit: 673000,   rate: 0.36, base: 121475 },
  { limit: 857900,   rate: 0.39, base: 179147 },
  { limit: 1817000,  rate: 0.41, base: 251258 },
  { limit: Infinity, rate: 0.45, base: 644489 },
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

// SARS deemed mileage rate — 2024/25
export const SARS_RATE_PER_KM = 4.84;

// VAT rate
export const VAT_RATE = 0.15;
