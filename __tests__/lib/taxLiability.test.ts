import { ageAtTaxYearEnd, calculateTaxLiability, TaxLiabilityInput } from "@/lib/taxLiability";
import { medicalTaxCreditForYear, taxDataForYear } from "@/lib/taxRules";

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
