import { ageAtTaxYearEnd, calculateTaxLiability, TaxLiabilityInput } from "@/lib/taxLiability";
import { medicalTaxCreditForYear, retirementSeveranceLumpSumTax, taxDataForYear } from "@/lib/taxRules";

function baseInput(overrides: Partial<TaxLiabilityInput> = {}): TaxLiabilityInput {
  return {
    taxYear: "2026/27",
    businessTaxableIncome: 0,
    otherTaxableIncome: 0,
    dateOfBirth: null,
    retirementAnnuityContributions: 0,
    medicalAidDependants: 0,
    donationsYtd: 0,
    taxAlreadyPaid: 0,
    retirementSeveranceLumpSum: 0,
    priorRetirementSeveranceLumpSums: 0,
    ...overrides,
  };
}

// ─── ageAtTaxYearEnd ──────────────────────────────────────────────────────────

describe("ageAtTaxYearEnd", () => {
  it("returns null when date of birth is null", () => {
    expect(ageAtTaxYearEnd(null, "2026/27")).toBeNull();
  });

  it("returns 65 the day someone turns 65 exactly at tax-year-end (28 Feb 2027, not a leap year)", () => {
    expect(ageAtTaxYearEnd("1962-02-28", "2026/27")).toBe(65);
  });

  it("returns 64 when the 65th birthday falls one day after tax-year-end", () => {
    expect(ageAtTaxYearEnd("1962-03-01", "2026/27")).toBe(64);
  });

  it("returns 75 the day someone turns 75 exactly at tax-year-end", () => {
    expect(ageAtTaxYearEnd("1952-02-28", "2026/27")).toBe(75);
  });

  it("returns 74 when the 75th birthday falls one day after tax-year-end", () => {
    expect(ageAtTaxYearEnd("1952-03-01", "2026/27")).toBe(74);
  });
});

// ─── calculateTaxLiability ────────────────────────────────────────────────────

describe("calculateTaxLiability", () => {
  it("produces zero tax after the rebate for a low income well under the tax threshold", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 50000 }));
    expect(result.grossTax).toBe(9000); // 50000 * 0.18
    expect(result.taxAfterRebates).toBe(0); // 9000 - 17820 primary rebate, floored at 0
    expect(result.finalLiability).toBe(0);
  });

  it("computes gross tax exactly at the first bracket boundary (2026/27)", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 245100 }));
    expect(result.grossTax).toBe(44118); // 245100 * 0.18, matches bracket 2's base exactly
  });

  it("computes gross tax one Rand into the second bracket (2026/27)", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 245101 }));
    expect(result.grossTax).toBe(44118); // 44118 + 1 * 0.26 = 44118.26, rounds to 44118
  });

  it("computes gross tax at the top bracket boundary (2026/27)", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 1878600 }));
    expect(result.grossTax).toBe(259783 + Math.round((1878600 - 887000) * 0.41));
  });

  it("computes gross tax one Rand into the top bracket (2026/27)", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 1878601 }));
    expect(result.grossTax).toBe(666339); // 666339 + 1 * 0.45 = 666339.45, rounds to 666339
  });

  it("applies the secondary rebate from age 65", () => {
    const result = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 500000, dateOfBirth: "1962-02-28", taxYear: "2026/27" }),
    );
    expect(result.age).toBe(65);
    expect(result.secondaryRebate).toBe(9765);
    expect(result.rebatesApplied).toBe(17820 + 9765);
  });

  it("does not apply the secondary rebate the day before someone turns 65", () => {
    const result = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 500000, dateOfBirth: "1962-03-01", taxYear: "2026/27" }),
    );
    expect(result.age).toBe(64);
    expect(result.secondaryRebate).toBe(0);
    expect(result.rebatesApplied).toBe(17820);
  });

  it("applies the tertiary rebate from age 75, stacked on primary and secondary", () => {
    const result = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 900000, dateOfBirth: "1952-02-28", taxYear: "2026/27" }),
    );
    expect(result.age).toBe(75);
    expect(result.tertiaryRebate).toBe(3249);
    expect(result.rebatesApplied).toBe(17820 + 9765 + 3249);
  });

  it("caps the retirement annuity deduction at 27.5% of income when that is below the absolute cap", () => {
    const result = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 1000000, retirementAnnuityContributions: 500000 }),
    );
    expect(result.retirementAnnuityCap).toBe(275000); // 27.5% of 1,000,000
    expect(result.retirementAnnuityDeductible).toBe(275000);
  });

  it("caps the retirement annuity deduction at the absolute Rand cap when 27.5% would exceed it", () => {
    const result = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 2000000, retirementAnnuityContributions: 500000 }),
    );
    expect(result.retirementAnnuityCap).toBe(430000); // 27.5% of 2,000,000 = 550,000 > 430,000 cap
    expect(result.retirementAnnuityDeductible).toBe(430000);
  });

  it("subtracts the retirement annuity deduction from taxable income before computing gross tax", () => {
    const withoutRa = calculateTaxLiability(baseInput({ businessTaxableIncome: 500000 }));
    const withRa = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 500000, retirementAnnuityContributions: 50000 }),
    );
    expect(withRa.taxableIncome).toBe(withoutRa.taxableIncome - 50000);
    expect(withRa.grossTax).toBeLessThan(withoutRa.grossTax);
  });

  it("applies the medical scheme fees credit for 0, 1, and 2+ dependants (2026/27)", () => {
    expect(medicalTaxCreditForYear(0, "2026/27")).toBe(376 * 12);
    expect(medicalTaxCreditForYear(1, "2026/27")).toBe(752 * 12);
    expect(medicalTaxCreditForYear(3, "2026/27")).toBe(752 * 12 + 2 * 254 * 12);
  });

  it("applies the medical scheme fees credit for 0, 1, and 2+ dependants (2025/26)", () => {
    expect(medicalTaxCreditForYear(0, "2025/26")).toBe(364 * 12);
    expect(medicalTaxCreditForYear(1, "2025/26")).toBe(728 * 12);
    expect(medicalTaxCreditForYear(3, "2025/26")).toBe(728 * 12 + 2 * 246 * 12);
  });

  it("produces a negative finalLiability (a refund) when tax already paid exceeds the amount owing", () => {
    const result = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 100000, taxAlreadyPaid: 50000 }),
    );
    expect(result.finalLiability).toBeLessThan(0);
  });

  it("produces a positive finalLiability (owing) when nothing has been paid", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 800000 }));
    expect(result.finalLiability).toBeGreaterThan(0);
  });

  it("uses different bracket data for 2025/26 vs 2026/27 for identical inputs", () => {
    const income = 500000;
    const y2526 = calculateTaxLiability(baseInput({ businessTaxableIncome: income, taxYear: "2025/26" }));
    const y2627 = calculateTaxLiability(baseInput({ businessTaxableIncome: income, taxYear: "2026/27" }));
    expect(y2526.grossTax).not.toBe(y2627.grossTax);
  });

  it("falls back to the latest known tax year for an unknown/future tax year instead of throwing", () => {
    expect(() => calculateTaxLiability(baseInput({ businessTaxableIncome: 100000, taxYear: "2030/31" }))).not.toThrow();
    const future = calculateTaxLiability(baseInput({ businessTaxableIncome: 500000, taxYear: "2030/31" }));
    const latest = calculateTaxLiability(baseInput({ businessTaxableIncome: 500000, taxYear: "2026/27" }));
    expect(future.grossTax).toBe(latest.grossTax);
    expect(taxDataForYear("2030/31")).toEqual(taxDataForYear("2026/27"));
  });

  it("ignores donationsYtd in v1 — donationsDeductible is always 0", () => {
    const withDonations = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 500000, donationsYtd: 100000 }),
    );
    const withoutDonations = calculateTaxLiability(baseInput({ businessTaxableIncome: 500000 }));
    expect(withDonations.donationsDeductible).toBe(0);
    expect(withDonations.taxableIncome).toBe(withoutDonations.taxableIncome);
  });
});

// ─── calculateTaxLiability — retirement/severance lump sums ──────────────────
// Regression coverage for the bug where a severance/retirement lump sum
// entered as "other income" was taxed at normal marginal rates instead of
// SARS's separate, more favourable lump-sum table.

describe("calculateTaxLiability — retirement/severance lump sums", () => {
  it("does NOT include the lump sum in taxableIncome or grossTax (normal brackets)", () => {
    const withLumpSum = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 300000, retirementSeveranceLumpSum: 707919.65 }),
    );
    const withoutLumpSum = calculateTaxLiability(baseInput({ businessTaxableIncome: 300000 }));
    expect(withLumpSum.taxableIncome).toBe(withoutLumpSum.taxableIncome);
    expect(withLumpSum.grossTax).toBe(withoutLumpSum.grossTax);
  });

  it("adds lumpSumTax on top of normal tax when computing finalLiability", () => {
    const result = calculateTaxLiability(
      baseInput({
        businessTaxableIncome: 300000,
        retirementSeveranceLumpSum: 707919.65,
        taxAlreadyPaid: 0,
      }),
    );
    expect(result.lumpSumTax).toBeGreaterThan(0);
    expect(result.finalLiability).toBe(result.taxAfterCredits + result.lumpSumTax);
  });

  it("Ian's case: R707,919.65 severance is taxed far more favourably than folding it into normal income would suggest", () => {
    // Normal income for the year (salary/bonus/leave, excluding severance): R291,482.27
    // Severance: R707,919.65, taxed separately, first lump sum ever
    // Tax already paid (PAYE R94,073.26 + directive tax on the lump sum R30,654.09): R124,727.35
    const result = calculateTaxLiability(
      baseInput({
        businessTaxableIncome: 0,
        otherTaxableIncome: 291482.27,
        retirementSeveranceLumpSum: 707919.65,
        priorRetirementSeveranceLumpSums: 0,
        taxAlreadyPaid: 124727.35,
      }),
    );
    // Lump sum tax should match the R550,000 tax-free / 18% table, ~R28,426 —
    // nowhere near what marginal-rate treatment on ~R1M combined income would produce.
    expect(result.lumpSumTax).toBe(28426);
    // Combining normal tax + lump sum tax should be well under what was
    // already withheld, i.e. this should point toward a refund, not a bill.
    expect(result.finalLiability).toBeLessThan(0);
  });

  it("a second lump sum in a later year respects how much of the R550,000 was already used", () => {
    const firstLumpSumUsesWholeAllowance = calculateTaxLiability(
      baseInput({ businessTaxableIncome: 0, retirementSeveranceLumpSum: 550000 }),
    );
    expect(firstLumpSumUsesWholeAllowance.lumpSumTax).toBe(0);

    const secondLumpSumNextYear = calculateTaxLiability(
      baseInput({
        businessTaxableIncome: 0,
        retirementSeveranceLumpSum: 100000,
        priorRetirementSeveranceLumpSums: 550000,
      }),
    );
    expect(secondLumpSumNextYear.lumpSumTax).toBe(18000); // taxed from the first rand at 18%
  });

  it("defaults to zero lump sum tax when no lump sum is entered", () => {
    const result = calculateTaxLiability(baseInput({ businessTaxableIncome: 300000 }));
    expect(result.lumpSumTax).toBe(0);
    expect(result.retirementSeveranceLumpSum).toBe(0);
    expect(result.lumpSumEntries).toEqual([]);
  });
});

// ─── calculateTaxLiability — actual SARS directive override ──────────────────
// A retirement/severance lump sum directive is issued automatically and shows
// the REAL tax SARS charged, which can differ from what
// retirementSeveranceLumpSumTax's standard-table estimate alone would
// predict (SARS's own calculation accounts for things this app cannot see,
// e.g. the person's full lifetime lump sum history). actualLumpSumTax lets
// that real figure override the estimate.

describe("calculateTaxLiability — actual SARS directive override", () => {
  it("actualLumpSumTax overrides the estimated calculation when provided", () => {
    const result = calculateTaxLiability(
      baseInput({ retirementSeveranceLumpSum: 707919.65, actualLumpSumTax: 30654.09 }),
    );
    // The estimate for this amount would be ~R28,426 (see the "Ian's case"
    // test above) — the actual directive figure is used instead.
    expect(result.lumpSumTax).toBe(30654.09);
    expect(result.lumpSumEntries).toEqual([
      { grossAmount: 707919.65, tax: 30654.09, isActual: true },
    ]);
  });

  it("falls back to the estimated calculation when actualLumpSumTax is not provided", () => {
    const result = calculateTaxLiability(baseInput({ retirementSeveranceLumpSum: 707919.65 }));
    expect(result.lumpSumTax).toBe(retirementSeveranceLumpSumTax(707919.65, 0));
    expect(result.lumpSumEntries).toEqual([
      { grossAmount: 707919.65, tax: result.lumpSumTax, isActual: false },
    ]);
  });

  it("sums multiple lump sums in the same tax year for both gross amount and tax", () => {
    // First two entries have real directive amounts; the third falls back to
    // the estimate, cumulative on top of the R700,000 the first two already
    // used of the lifetime R550,000 tax-free allowance.
    const result = calculateTaxLiability(
      baseInput({
        retirementSeveranceLumpSum: 400000,
        actualLumpSumTax: 5000,
        additionalLumpSums: [
          { grossAmount: 300000, actualTax: 8000 },
          { grossAmount: 200000 },
        ],
      }),
    );
    const estimateForThird = retirementSeveranceLumpSumTax(200000, 700000);

    expect(result.retirementSeveranceLumpSum).toBe(900000);
    expect(result.lumpSumTax).toBe(5000 + 8000 + estimateForThird);
    expect(result.lumpSumEntries).toEqual([
      { grossAmount: 400000, tax: 5000, isActual: true },
      { grossAmount: 300000, tax: 8000, isActual: true },
      { grossAmount: 200000, tax: estimateForThird, isActual: false },
    ]);
  });

  it("Ian's case: three lump sums in the same year use their real SARS directive amounts, not the combined-estimate table", () => {
    // Severance (R707,919.65) plus two further lump sums received the same
    // tax year (e.g. share scheme vesting payouts), each with its own
    // issued SARS directive.
    const result = calculateTaxLiability(
      baseInput({
        businessTaxableIncome: 0,
        retirementSeveranceLumpSum: 707919.65,
        actualLumpSumTax: 30654.09,
        additionalLumpSums: [
          { grossAmount: 285317.12, actualTax: 102714.16 },
          { grossAmount: 90183.0, actualTax: 32465.88 },
        ],
      }),
    );

    expect(result.retirementSeveranceLumpSum).toBeCloseTo(1083419.77, 2);
    expect(result.lumpSumTax).toBeCloseTo(165834.13, 2);

    // The standard table alone would estimate far less tax on the combined
    // total than the sum of the three real directive amounts.
    const combinedEstimate = retirementSeveranceLumpSumTax(1083419.77, 0);
    expect(combinedEstimate).toBe(124223);
    expect(result.lumpSumTax).toBeGreaterThan(combinedEstimate);
  });
});
