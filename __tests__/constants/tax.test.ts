import { SA_MARGINAL_TAX_RATE } from "@/constants/tax";
import { CATEGORY_PARTIAL_CAPS, CATEGORIES } from "@/constants/categories";

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
