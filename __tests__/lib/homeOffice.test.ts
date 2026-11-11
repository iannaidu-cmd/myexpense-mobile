import {
  annualDeductible,
  apportion,
  floorRatio,
  formatRatio,
  HOME_OFFICE_CATS,
  isHomeOfficeCategory,
  pctFromRatio,
  setupClaimDescription,
  setupClaimForYear,
} from "@/lib/homeOffice";
import type { HomeOfficeSetting } from "@/services/homeOfficeService";

// Test inputs only: 12 m2 of 120 m2 (10%), renting at R10,000 a month.
const renting: HomeOfficeSetting = {
  officeM2: 12,
  totalM2: 120,
  arrangementType: "renting",
  annualCost: 120_000,
  costTaxYear: "2026/27",
};

describe("setupClaimForYear", () => {
  it("claims annual cost x floor ratio for the matching year with nothing logged", () => {
    expect(setupClaimForYear(renting, "2026/27", 0)).toBe(12_000);
  });

  it("claims nothing when Home Office expenses are logged that year (no double count)", () => {
    expect(setupClaimForYear(renting, "2026/27", 1)).toBe(0);
  });

  it("claims nothing for a different tax year", () => {
    expect(setupClaimForYear(renting, "2025/26", 0)).toBe(0);
  });

  it("claims nothing when the setup has no tax year (saved before it was recorded)", () => {
    expect(setupClaimForYear({ ...renting, costTaxYear: null }, "2026/27", 0)).toBe(0);
  });

  it("claims nothing for arrangement none", () => {
    expect(setupClaimForYear({ ...renting, arrangementType: "none" }, "2026/27", 0)).toBe(0);
  });

  it("claims nothing with no setup", () => {
    expect(setupClaimForYear(null, "2026/27", 0)).toBe(0);
  });

  it("caps an office bigger than the home at 100%", () => {
    const s = { ...renting, officeM2: 200 };
    expect(floorRatio(s)).toBe(1);
    expect(setupClaimForYear(s, "2026/27", 0)).toBe(120_000);
  });

  it("works for bond interest the same way", () => {
    expect(setupClaimForYear({ ...renting, arrangementType: "owned", annualCost: 50_000 }, "2026/27", 0)).toBe(5_000);
  });
});

describe("apportion", () => {
  it("rounds to 2 decimals", () => {
    expect(apportion(2000, 0.1)).toBe(200);
    expect(apportion(1234.56, 1 / 3)).toBe(411.52);
    expect(apportion(1.005, 1)).toBe(1.01);
  });

  it("returns the input for ratio 1", () => {
    expect(apportion(1500, 1)).toBe(1500);
    expect(apportion(99.99, 1)).toBe(99.99);
  });
});

describe("helpers", () => {
  it("pctFromRatio stores 2 decimals", () => {
    expect(pctFromRatio(0.1)).toBe(10);
    expect(pctFromRatio(1 / 3)).toBe(33.33);
    expect(pctFromRatio(1)).toBe(100);
  });

  it("formatRatio drops a trailing .0", () => {
    expect(formatRatio(0.1)).toBe("10%");
    expect(formatRatio(0.125)).toBe("12.5%");
  });

  it("annualDeductible keeps its existing rounding to whole rands", () => {
    expect(annualDeductible({ ...renting, annualCost: 100_005 })).toBe(10_001);
  });

  it("knows the three home office categories", () => {
    expect([...HOME_OFFICE_CATS]).toEqual(["Home Office", "Utilities", "Repairs & Maintenance"]);
    expect(isHomeOfficeCategory("Utilities")).toBe(true);
    expect(isHomeOfficeCategory("Insurance")).toBe(false);
    expect(isHomeOfficeCategory(null)).toBe(false);
  });

  it("describes where the setup amount came from", () => {
    expect(setupClaimDescription(renting)).toMatch(/^Home office setup: 10% of R 120.000 annual rent$/);
    expect(setupClaimDescription({ ...renting, arrangementType: "owned" })).toMatch(/annual bond interest$/);
  });
});
