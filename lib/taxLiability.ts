// SARS tax liability estimation — pure calculation, no I/O.
// Implements the ITR12 "step 2" formula: taxable income → SARS brackets →
// less rebates & medical credits → less tax already paid = owed or refund.
// See TaxLiabilityInput/Result below for the exact shape; keep this file
// free of Supabase/React so it stays independently testable
// (see __tests__/lib/taxLiability.test.ts).

import {
  medicalTaxCreditForYear,
  raDeductionCap,
  retirementSeveranceLumpSumTax,
  taxDataForYear,
  TaxBracket,
} from "@/lib/taxRules";

export interface TaxLiabilityInput {
  taxYear: string;
  /** Turnover minus allowable business expenses — computed by the caller. */
  businessTaxableIncome: number;
  /** Single combined figure for income outside the business (salary, rental, investments, etc). */
  otherTaxableIncome: number;
  /** "YYYY-MM-DD"; null if not yet captured — treated as under-65 (primary rebate only). */
  dateOfBirth: string | null;
  /** Raw contributions before the S11F cap is applied. */
  retirementAnnuityContributions: number;
  /** Dependants on the medical aid, excluding the main member. */
  medicalAidDependants: number;
  /**
   * Section 18A donations for the tax year. Accepted but NOT used in v1 —
   * the deduction is always 0 (see donationsDeductible below). When S18A is
   * built (v2), this becomes: min(donationsYtd, 0.10 * taxableIncomeBeforeDonations).
   * Kept as an input now so v2 only needs to flip the calculation on, not
   * add a new field/migration.
   */
  donationsYtd: number;
  /** PAYE withheld or provisional tax paid to date for this tax year — include
   * any tax already withheld on the lump sum below (e.g. via a SARS tax
   * directive), since taxAlreadyPaid is one combined "total tax paid" figure. */
  taxAlreadyPaid: number;
  /**
   * A retirement, death, or severance/retrenchment lump sum received this
   * tax year (e.g. IRP5 source code 3901/3907/etc, or a tax directive).
   * Taxed on its OWN separate SARS table (retirementSeveranceLumpSumTax) —
   * never added to otherTaxableIncome, which would tax it at normal
   * marginal rates and significantly overstate the liability.
   */
  retirementSeveranceLumpSum: number;
  /**
   * Rand total of qualifying retirement/severance lump sums already
   * received in PRIOR tax years (since 1 Oct 2007), needed because the
   * R550,000 tax-free amount is a lifetime total, not per payout. 0 if this
   * is the person's first such lump sum.
   */
  priorRetirementSeveranceLumpSums: number;
  /**
   * The real, authoritative tax SARS charged on retirementSeveranceLumpSum,
   * from an already-issued tax directive, if known. retirementSeveranceLumpSumTax
   * (see lib/taxRules.ts) is only an ESTIMATE using the standard table — a
   * real directive can differ because SARS's own calculation accounts for
   * factors this app cannot see (e.g. the person's full lifetime lump sum
   * history). When provided, this is used directly instead of the estimate.
   */
  actualLumpSumTax?: number;
  /**
   * Additional retirement/death/severance lump sums received in the SAME
   * tax year beyond the primary one above — e.g. a severance payout plus a
   * separately-directived share scheme vesting lump sum. Each is summed
   * into the total lump sum gross amount and tax alongside the primary
   * entry (see LumpSumEntry and TaxLiabilityResult.lumpSumEntries).
   */
  additionalLumpSums?: LumpSumEntry[];
}

/** One retirement/severance lump sum payout: its gross amount, and — if
 * already known from an issued SARS directive — the real tax charged on it. */
export interface LumpSumEntry {
  grossAmount: number;
  actualTax?: number;
}

export interface TaxLiabilityResult {
  taxYear: string;
  retirementAnnuityDeductible: number;
  retirementAnnuityCap: number;
  /** Always 0 in v1 — Section 18A donations deduction ships in v2. */
  donationsDeductible: number;
  taxableIncome: number;
  grossTax: number;
  /** Age as at the end of the tax year (28/29 Feb); null if date of birth unknown. */
  age: number | null;
  primaryRebate: number;
  secondaryRebate: number;
  tertiaryRebate: number;
  rebatesApplied: number;
  taxAfterRebates: number;
  medicalCreditApplied: number;
  taxAfterCredits: number;
  taxAlreadyPaid: number;
  /** Sum of every lump sum entry's gross amount (primary + additionalLumpSums). */
  retirementSeveranceLumpSum: number;
  /** Sum of every lump sum entry's tax (primary + additionalLumpSums combined) — not part of grossTax/taxAfterCredits above. */
  lumpSumTax: number;
  /** Per-entry breakdown behind retirementSeveranceLumpSum/lumpSumTax above, in the order given (primary first). Excludes zero-amount entries. */
  lumpSumEntries: { grossAmount: number; tax: number; isActual: boolean }[];
  /** Positive = amount owing to SARS. Negative = refund due. Not floored at 0. */
  finalLiability: number;
}

// Builds the per-entry lump sum breakdown (primary + additionalLumpSums) and
// their gross/tax totals. Each entry without an actualTax override is taxed
// against the standard table cumulatively — the R550,000 lifetime exemption
// is consumed in order, starting from priorRetirementSeveranceLumpSums and
// growing by each entry's gross amount as we go, whether that entry's own
// tax came from an actual directive or an estimate (SARS's lifetime
// aggregation is based on amounts received, not on how the tax was sourced).
function computeLumpSumBreakdown(
  input: TaxLiabilityInput,
): { totalGross: number; totalTax: number; entries: { grossAmount: number; tax: number; isActual: boolean }[] } {
  const rawEntries: LumpSumEntry[] = [
    { grossAmount: input.retirementSeveranceLumpSum, actualTax: input.actualLumpSumTax },
    ...(input.additionalLumpSums ?? []),
  ].filter((entry) => Math.max(0, entry.grossAmount) > 0);

  let runningPrior = Math.max(0, input.priorRetirementSeveranceLumpSums);
  let totalGross = 0;
  let totalTax = 0;
  const entries = rawEntries.map((entry) => {
    const grossAmount = Math.max(0, entry.grossAmount);
    const isActual = entry.actualTax !== undefined && entry.actualTax !== null;
    const tax = isActual
      ? Math.max(0, entry.actualTax as number)
      : retirementSeveranceLumpSumTax(grossAmount, runningPrior);
    totalGross += grossAmount;
    totalTax += tax;
    runningPrior += grossAmount;
    return { grossAmount, tax, isActual };
  });

  return { totalGross, totalTax, entries };
}

// Age as at the end of the given tax year (28/29 February). Uses
// `new Date(endCalendarYear, 2, 0)` — day 0 of March — which resolves to the
// last day of February and is leap-year-safe for any calendar year, not just
// the years currently hardcoded in TAX_DATA_BY_YEAR.
export function ageAtTaxYearEnd(dateOfBirth: string | null, taxYear: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;

  const startYear = parseInt(taxYear.split("/")[0], 10);
  if (isNaN(startYear)) return null;
  const endCalendarYear = startYear + 1;
  const taxYearEnd = new Date(endCalendarYear, 2, 0); // last day of February, endCalendarYear

  let age = taxYearEnd.getFullYear() - dob.getFullYear();
  const hadBirthdayYet =
    taxYearEnd.getMonth() > dob.getMonth() ||
    (taxYearEnd.getMonth() === dob.getMonth() && taxYearEnd.getDate() >= dob.getDate());
  if (!hadBirthdayYet) age--;
  return age;
}

function computeGrossTax(taxableIncome: number, brackets: TaxBracket[]): number {
  for (let i = 0; i < brackets.length; i++) {
    const bracket = brackets[i];
    if (taxableIncome <= bracket.limit) {
      const lowerLimit = i === 0 ? 0 : brackets[i - 1].limit;
      return Math.round(bracket.base + (taxableIncome - lowerLimit) * bracket.rate);
    }
  }
  return 0; // unreachable — the top bracket's limit is Infinity
}

export function calculateTaxLiability(input: TaxLiabilityInput): TaxLiabilityResult {
  const yearData = taxDataForYear(input.taxYear);

  // S11F cap: 27.5% of the greater of remuneration or taxable income. v1 has
  // no separate "remuneration" input — freelancers' combined business + other
  // income stands in for it, which collapses to the same figure here.
  const incomeForRaCap = input.businessTaxableIncome + input.otherTaxableIncome;
  const retirementAnnuityCap = raDeductionCap(incomeForRaCap, input.taxYear);
  const retirementAnnuityDeductible = Math.min(
    Math.max(input.retirementAnnuityContributions, 0),
    retirementAnnuityCap,
  );

  // Section 18A — v2. Always 0 in v1 regardless of donationsYtd.
  const donationsDeductible = 0;

  const taxableIncome = Math.max(
    0,
    input.businessTaxableIncome + input.otherTaxableIncome - retirementAnnuityDeductible - donationsDeductible,
  );

  const grossTax = computeGrossTax(taxableIncome, yearData.brackets);

  const age = ageAtTaxYearEnd(input.dateOfBirth, input.taxYear);
  const primaryRebate = yearData.rebates.primary;
  const secondaryRebate = age !== null && age >= 65 ? yearData.rebates.secondary : 0;
  const tertiaryRebate = age !== null && age >= 75 ? yearData.rebates.tertiary : 0;
  const rebatesApplied = primaryRebate + secondaryRebate + tertiaryRebate;

  const taxAfterRebates = Math.max(0, grossTax - rebatesApplied);

  const medicalCreditApplied = medicalTaxCreditForYear(input.medicalAidDependants, input.taxYear);
  const taxAfterCredits = Math.max(0, taxAfterRebates - medicalCreditApplied);

  const { totalGross: lumpSumGrossTotal, totalTax: lumpSumTax, entries: lumpSumEntries } =
    computeLumpSumBreakdown(input);

  const finalLiability = taxAfterCredits + lumpSumTax - input.taxAlreadyPaid;

  return {
    taxYear: input.taxYear,
    retirementAnnuityDeductible,
    retirementAnnuityCap,
    donationsDeductible,
    taxableIncome,
    grossTax,
    age,
    primaryRebate,
    secondaryRebate,
    tertiaryRebate,
    rebatesApplied,
    taxAfterRebates,
    medicalCreditApplied,
    taxAfterCredits,
    taxAlreadyPaid: input.taxAlreadyPaid,
    retirementSeveranceLumpSum: lumpSumGrossTotal,
    lumpSumTax,
    lumpSumEntries,
    finalLiability,
  };
}
