// Figures shown on screen must match what the tax engine actually applies:
// no credit or saving for someone who has no data behind it.
import { medicalSchemeFeesCredit } from "@/lib/itr12Summary";
import { calculateTaxLiability } from "@/lib/taxLiability";
import { estimateTaxSaving, medicalTaxCreditForYear } from "@/lib/taxRules";

const YEAR = "2026/27";

describe("medicalSchemeFeesCredit", () => {
  it("is 0 with no contributions, even for 0 or more dependants", () => {
    expect(medicalSchemeFeesCredit([], 0, 0, YEAR)).toBe(0);
    expect(medicalSchemeFeesCredit([], null, 2, YEAR)).toBe(0);
  });

  it("applies once a monthly amount is entered", () => {
    expect(medicalSchemeFeesCredit([], 1000, 0, YEAR)).toBe(medicalTaxCreditForYear(0, YEAR));
  });

  it("applies when medical aid payments are logged as expenses", () => {
    const expenses = [{ category: "Medical", amount: 1500, sars_field: "4005" }] as any[];
    expect(medicalSchemeFeesCredit(expenses, 0, 1, YEAR)).toBe(medicalTaxCreditForYear(1, YEAR));
  });
});

describe("estimateTaxSaving", () => {
  it("is 0 with no income", () => {
    expect(estimateTaxSaving(50_000, 0, YEAR)).toBe(0);
  });

  it("is 0 when income is below the tax threshold", () => {
    expect(estimateTaxSaving(10_000, 80_000, YEAR)).toBe(0);
  });

  it("matches the difference in the engine's tax", () => {
    const base = {
      taxYear: YEAR, otherTaxableIncome: 0, dateOfBirth: null, retirementAnnuityContributions: 0,
      medicalAidDependants: 0, donationsYtd: 0, taxAlreadyPaid: 0,
      retirementSeveranceLumpSum: 0, priorRetirementSeveranceLumpSums: 0,
    } as any;
    const before = calculateTaxLiability({ ...base, businessTaxableIncome: 400_000 }).taxAfterRebates;
    const after = calculateTaxLiability({ ...base, businessTaxableIncome: 350_000 }).taxAfterRebates;
    expect(estimateTaxSaving(50_000, 400_000, YEAR)).toBe(before - after);
  });
});
