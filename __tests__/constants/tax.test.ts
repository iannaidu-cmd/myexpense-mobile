import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { CATEGORY_PARTIAL_CAPS, CATEGORIES } from "@/constants/categories";
import { retirementSeveranceLumpSumTax } from "@/lib/taxRules";

// ─── SA_MARGINAL_TAX_RATE ─────────────────────────────────────────────────────

describe("SA_MARGINAL_TAX_RATE", () => {
  it("is 31% as per SARS 2024/25 mid-range estimate", () => {
    expect(SA_MARGINAL_TAX_RATE).toBe(0.31);
  });

  it("produces correct tax saving for a given deduction amount", () => {
    const deductions = 10_000;
    expect(Math.round(deductions * SA_MARGINAL_TAX_RATE)).toBe(3_100);
  });

  it("is between 0 and 1 (a valid fraction)", () => {
    expect(SA_MARGINAL_TAX_RATE).toBeGreaterThan(0);
    expect(SA_MARGINAL_TAX_RATE).toBeLessThan(1);
  });
});

// ─── CATEGORY_PARTIAL_CAPS ────────────────────────────────────────────────────

describe("CATEGORY_PARTIAL_CAPS", () => {
  it("applies 80% cap to Meals & Entertainment (S23(o) SARS rule)", () => {
    expect(CATEGORY_PARTIAL_CAPS["Meals & Entertainment"]).toBe(0.8);
  });

  it("does not cap Travel & Transport (fully deductible)", () => {
    expect(CATEGORY_PARTIAL_CAPS["Travel & Transport"]).toBeUndefined();
  });

  it("does not cap Professional Fees (fully deductible)", () => {
    expect(CATEGORY_PARTIAL_CAPS["Professional Fees"]).toBeUndefined();
  });

  it("only caps categories that explicitly set partialCap", () => {
    const cappedCategories = CATEGORIES.filter((c) => c.partialCap !== undefined);
    expect(Object.keys(CATEGORY_PARTIAL_CAPS)).toHaveLength(cappedCategories.length);
  });

  it("calculates correct deductible amount with 80% cap", () => {
    const amount = 1_000;
    const cap = CATEGORY_PARTIAL_CAPS["Meals & Entertainment"] ?? 1;
    expect(amount * cap).toBe(800);
  });

  it("calculates correct deductible amount for uncapped category", () => {
    const amount = 1_000;
    const cap = CATEGORY_PARTIAL_CAPS["Professional Fees"] ?? 1;
    expect(amount * cap).toBe(1_000);
  });
});

// ─── retirementSeveranceLumpSumTax ────────────────────────────────────────────

describe("retirementSeveranceLumpSumTax", () => {
  it("is zero for a lump sum under the R550,000 tax-free amount", () => {
    expect(retirementSeveranceLumpSumTax(400_000)).toBe(0);
  });

  it("is zero for a lump sum of exactly R550,000", () => {
    expect(retirementSeveranceLumpSumTax(550_000)).toBe(0);
  });

  it("charges 18% on the amount between R550,000 and R770,000", () => {
    // Ian's case: R707,919.65 severance pay, first lump sum ever.
    // (707,919.65 - 550,000) * 0.18 = 28,425.537 -> rounds to 28,426
    expect(retirementSeveranceLumpSumTax(707_919.65)).toBe(28_426);
  });

  it("matches SARS's published worked example (R900,000 lump sum)", () => {
    // R550,000 @ 0% + R220,000 @ 18% (R39,600) + R130,000 @ 27% (R35,100) = R74,700
    expect(retirementSeveranceLumpSumTax(900_000)).toBe(74_700);
  });

  it("charges the correct amount at the top marginal bracket", () => {
    // R1,155,000 flat = R143,550 exactly, per the published table
    expect(retirementSeveranceLumpSumTax(1_155_000)).toBe(143_550);
  });

  it("is zero for a zero or negative lump sum", () => {
    expect(retirementSeveranceLumpSumTax(0)).toBe(0);
    expect(retirementSeveranceLumpSumTax(-100)).toBe(0);
  });

  it("respects the lifetime R550,000 aggregation across prior lump sums", () => {
    // Already used the full tax-free amount with an earlier R550,000 lump sum;
    // this year's R100,000 lump sum should be taxed from the first rand at 18%.
    expect(retirementSeveranceLumpSumTax(100_000, 550_000)).toBe(18_000);
  });

  it("splits the tax-free amount correctly when prior lump sums used only part of it", () => {
    // R400,000 already used; R150,000 of the R550,000 tax-free amount remains.
    // This year's R300,000 lump sum: R150,000 @ 0% + R150,000 @ 18% = R27,000
    expect(retirementSeveranceLumpSumTax(300_000, 400_000)).toBe(27_000);
  });
});
