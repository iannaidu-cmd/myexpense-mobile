import { vehicleLogbook, withLogbookShare, waitingForLogbook, logbookRatioFor } from "@/lib/vehicleClaim";
import { buildExpenditure, filingChecks } from "@/lib/itr12Summary";

const reading = (vehicleId: string, openingKm: number | null, closingKm: number | null) => ({ vehicleId, openingKm, closingKm });
const trip = (vehicle_id: string | null, distance_km: number) => ({ vehicle_id, distance_km });
const fuel = (over: Record<string, unknown> = {}) => ({
  category: "Vehicle Expenses", amount: 1000, is_deductible: true, vat_amount: 0, ...over,
});

describe("vehicleLogbook", () => {
  it("works out each vehicle's share and the overall share from complete readings only", () => {
    const lb = vehicleLogbook(
      [trip("a", 2000), trip("b", 500), trip("c", 300)],
      [reading("a", 10_000, 20_000), reading("b", 0, 5_000), reading("c", 100, null)],
      true,
    );
    expect(lb.byVehicle).toEqual({ a: 0.2, b: 0.1 });
    expect(lb.overall).toBeCloseTo(2500 / 15_000);
    expect(lb.byVehicle.c).toBeUndefined();
  });

  it("has no overall share until some vehicle has both readings", () => {
    expect(vehicleLogbook([trip("a", 10)], [reading("a", 176_014, null)], true).overall).toBeNull();
  });
});

describe("withLogbookShare", () => {
  const lb = vehicleLogbook([trip("a", 2000)], [reading("a", 10_000, 20_000)], true);

  it("claims the logbook share of the full cost, for imported rows with no %", () => {
    const e: any = withLogbookShare(fuel({ vehicle_id: "a" }), lb);
    expect(e.amount).toBe(200);
    expect(e.gross_amount).toBe(1000);
    expect(e.business_use_pct).toBe(20);
  });

  it("replaces a % typed in by hand, starting from the full cost", () => {
    const e = withLogbookShare(fuel({ amount: 600, gross_amount: 1000, business_use_pct: 60 }), lb);
    expect(e.amount).toBe(200);
  });

  it("uses the overall share for a row not linked to a vehicle", () => {
    expect(logbookRatioFor({ vehicle_id: null }, lb)).toBe(0.2);
  });

  it("claims R0 while the logbook can't be worked out yet", () => {
    const none = vehicleLogbook([trip("a", 0.006)], [reading("a", 176_014, null)], true);
    expect(withLogbookShare(fuel(), none).amount).toBe(0);
  });

  it("claims R0 for salaried employees", () => {
    const employee = vehicleLogbook([trip("a", 2000)], [reading("a", 10_000, 20_000)], false);
    expect(withLogbookShare(fuel({ vehicle_id: "a" }), employee).amount).toBe(0);
  });

  it("leaves the wear and tear row and other categories alone", () => {
    const wt = fuel({ wear_and_tear_vehicle_id: "a", amount: 5000 });
    expect(withLogbookShare(wt, lb)).toBe(wt);
    const phone = { category: "Telephone & Internet", amount: 100 };
    expect(withLogbookShare(phone, lb)).toBe(phone);
  });

  it("treats the old 'Fuel & Oil' name as a vehicle cost", () => {
    expect(withLogbookShare(fuel({ category: "Fuel & Oil", vehicle_id: "a" }), lb).amount).toBe(200);
  });

  it("takes only the logbook share of claimable VAT for a VAT vendor", () => {
    const e = fuel({ vehicle_id: "a", amount: 1150, vat_amount: 150 });
    const exp = buildExpenditure([e], true, 0, lb);
    // 20% of R1 150 = R230, less 20% of the R150 VAT = R30.
    expect(exp.rows[0].amount).toBeCloseTo(200);
  });
});

describe("ITR12 with a logbook", () => {
  it("puts only the logbook share in Travel Costs – Local", () => {
    const lb = vehicleLogbook([trip("a", 2500)], [reading("a", 0, 10_000)], true);
    const exp = buildExpenditure([fuel({ vehicle_id: "a", amount: 4000 })], false, 0, lb);
    expect(exp.rows).toEqual([expect.objectContaining({ field: "Travel Costs – Local", rands: 1000 })]);
  });

  it("flags running costs waiting for the closing odometer reading", () => {
    const none = vehicleLogbook([], [reading("a", 176_014, null)], true);
    const rows = [fuel({ amount: 2519.63 }), fuel({ amount: 1412.61 }), fuel({ wear_and_tear_vehicle_id: "a" })];
    expect(waitingForLogbook(rows, none)).toEqual({ amount: 3932.24, count: 2 });
    expect(filingChecks(rows, none)).toContainEqual({ kind: "logbookIncomplete", amount: 3932.24, count: 2 });
    expect(buildExpenditure(rows.slice(0, 2), false, 0, none).rows).toEqual([]);
  });
});

describe("phone costs with no work share", () => {
  it("are flagged before filing", () => {
    const rows = [
      { category: "Telephone & Internet", amount: 259, is_deductible: true, vendor: "Telkom 25 GB", expense_date: "2026-03-03" },
      { category: "Telephone & Internet", amount: 60, gross_amount: 100, business_use_pct: 60, is_deductible: true, vendor: "Vodacom", expense_date: "2026-03-04" },
    ];
    const checks = filingChecks(rows);
    expect(checks).toContainEqual(expect.objectContaining({ kind: "phoneShareNotSet", amount: 259 }));
    expect(checks.filter((c) => c.kind === "phoneShareNotSet")).toHaveLength(1);
  });
});
