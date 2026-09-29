import {
  monthsInUse,
  purchaseVatCanBeClaimed,
  saleOutcome,
  taxValueAfter,
  wearAndTearAllowance,
  wearAndTearClaim,
  wearAndTearCostBase,
} from "@/lib/wearAndTear";

describe("monthsInUse", () => {
  it("counts the acquisition month as a full month", () => {
    expect(monthsInUse("2026-12-15", "2026/27")).toBe(3); // Dec, Jan, Feb
    expect(monthsInUse("2026-03-01", "2026/27")).toBe(12);
    expect(monthsInUse("2027-02-28", "2026/27")).toBe(1);
  });

  it("is 12 for later years and 0 for years before acquisition", () => {
    expect(monthsInUse("2026-12-15", "2027/28")).toBe(12);
    expect(monthsInUse("2026-12-15", "2025/26")).toBe(0);
  });
});

describe("wearAndTearAllowance", () => {
  const car = { cost: 300_000, acquiredDate: "2026-12-10", type: "passenger" as const };

  it("pro-rates the first year by months in use", () => {
    // 300 000 / 5 × 3/12
    expect(wearAndTearAllowance({ ...car, taxYear: "2026/27" })).toBe(15_000);
  });

  it("claims a full year after the first", () => {
    expect(wearAndTearAllowance({ ...car, taxYear: "2027/28" })).toBe(60_000);
  });

  it("claims the remainder in the final year and nothing after", () => {
    // 15 000 + 4 × 60 000 = 255 000 → 45 000 left in year 6
    expect(wearAndTearAllowance({ ...car, taxYear: "2031/32" })).toBe(45_000);
    expect(wearAndTearAllowance({ ...car, taxYear: "2032/33" })).toBe(0);
  });

  it("writes a delivery vehicle off over 4 years", () => {
    expect(
      wearAndTearAllowance({ cost: 200_000, acquiredDate: "2025-03-01", type: "delivery", taxYear: "2026/27" }),
    ).toBe(50_000);
  });

  it("keeps the write-off clock running for years before the tax year asked for", () => {
    // Bought 2020, 5-year period ended 2024/25 → nothing left by 2026/27
    expect(
      wearAndTearAllowance({ cost: 250_000, acquiredDate: "2020-03-01", type: "passenger", taxYear: "2026/27" }),
    ).toBe(0);
  });

  it("writes off items under R7 000 in full in the year acquired", () => {
    const scooter = { cost: 6_500, acquiredDate: "2026-06-01", type: "motorcycle" as const };
    expect(wearAndTearAllowance({ ...scooter, taxYear: "2026/27" })).toBe(6_500);
    expect(wearAndTearAllowance({ ...scooter, taxYear: "2027/28" })).toBe(0);
  });

  it("does not apply the small-items rule at exactly R7 000", () => {
    expect(
      wearAndTearAllowance({ cost: 7_000, acquiredDate: "2026-03-01", type: "motorcycle", taxYear: "2026/27" }),
    ).toBe(1_750);
  });

  it("is 0 before the vehicle was acquired", () => {
    expect(wearAndTearAllowance({ ...car, taxYear: "2025/26" })).toBe(0);
  });
});

describe("wearAndTearCostBase", () => {
  it("excludes VAT only when it was claimed back", () => {
    expect(wearAndTearCostBase(115_000, true)).toBe(100_000);
    expect(wearAndTearCostBase(115_000, false)).toBe(115_000);
  });
});

describe("wearAndTearClaim", () => {
  it("applies the business-use %", () => {
    expect(wearAndTearClaim(60_000, 0.432)).toBe(25_920);
  });

  it("clamps the ratio to 0–100%", () => {
    expect(wearAndTearClaim(60_000, 1.3)).toBe(60_000);
    expect(wearAndTearClaim(60_000, -1)).toBe(0);
  });
});

describe("selling a vehicle", () => {
  // SARS IN60 (Issue 2) Example 1: R500 000 passenger car bought at the start
  // of year 1, sold at the end of year 3 for R150 000. Logbook: 54 000
  // business km of 90 000 km over the three years.
  const car = { cost: 500_000, acquiredDate: "2021-03-01", type: "passenger" as const, soldDate: "2024-02-28" };

  it("claims a full year in the year of sale when sold in its last month", () => {
    expect(monthsInUse(car.acquiredDate, "2023/24", car.soldDate)).toBe(12);
    // IN60: R500 000 / 5 × 15 000 / 35 000 = R42 857
    expect(wearAndTearClaim(wearAndTearAllowance({ ...car, taxYear: "2023/24" }), 15_000 / 35_000)).toBe(42_857.14);
  });

  it("stops wear & tear after the sale", () => {
    expect(wearAndTearAllowance({ ...car, taxYear: "2024/25" })).toBe(0);
  });

  it("works out tax value ignoring private use", () => {
    expect(taxValueAfter(car, "2023/24")).toBe(200_000);
  });

  it("matches IN60's loss after taking out private use", () => {
    const r = saleOutcome(car, 150_000, 54_000 / 90_000);
    expect(r.grossLoss).toBe(50_000);
    expect(r.loss).toBe(30_000);
    expect(r.recoupment).toBe(0);
  });

  it("recoups the excess over tax value, capped at cost, for business use only", () => {
    const r = saleOutcome(car, 250_000, 54_000 / 90_000);
    expect(r.grossRecoupment).toBe(50_000);
    expect(r.recoupment).toBe(30_000);
    expect(saleOutcome(car, 600_000, 1).grossRecoupment).toBe(300_000); // capped at cost
  });

  it("pro-rates the year of sale to the sale month", () => {
    const mid = { ...car, soldDate: "2023-08-15" }; // Mar–Aug = 6 months
    expect(monthsInUse(mid.acquiredDate, "2023/24", mid.soldDate)).toBe(6);
    expect(wearAndTearAllowance({ ...mid, taxYear: "2023/24" })).toBe(50_000);
  });

  it("counts both the purchase and sale month when both fall in one tax year", () => {
    expect(monthsInUse("2026-05-10", "2026/27", "2026-09-20")).toBe(5); // May–Sep
  });
});

describe("double cabs and purchase VAT", () => {
  it("writes a double cab off over 5 years, like a passenger car", () => {
    expect(
      wearAndTearAllowance({ cost: 500_000, acquiredDate: "2026-03-01", type: "double_cab", taxYear: "2026/27" }),
    ).toBe(100_000);
  });

  it("only lets VAT on the purchase be claimed where the vehicle isn't a 'motor car'", () => {
    expect(purchaseVatCanBeClaimed("passenger")).toBe(false);
    expect(purchaseVatCanBeClaimed("double_cab")).toBe(false);
    expect(purchaseVatCanBeClaimed("delivery")).toBe(true);
    expect(purchaseVatCanBeClaimed("motorcycle")).toBe(true);
  });
});
