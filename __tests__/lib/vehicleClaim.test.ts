import { vehicleLogbook, withLogbookShare, waitingForLogbook, logbookRatioFor, taxYearEndISO, vehicleClaimNote } from "@/lib/vehicleClaim";
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

describe("running estimate from the latest odometer reading", () => {
  const latest = (updatedAt: string) =>
    vehicleLogbook([trip("a", 3000)], [{ vehicleId: "a", openingKm: 100_000, closingKm: 110_000, updatedAt }], true, "2026/27");

  it("uses a reading saved during the year and marks it as an estimate", () => {
    const lb = latest("2026-11-25T10:00:00Z");
    expect(lb.byVehicle.a).toBe(0.3);
    expect(lb.estimateFrom).toBe("2026-11-25");
    expect(withLogbookShare(fuel({ vehicle_id: "a" }), lb).amount).toBe(300);
  });

  it("treats a reading saved on or after the last day of the tax year as final", () => {
    expect(latest("2027-02-28T18:00:00Z").estimateFrom).toBeNull();
    expect(latest("2027-03-02T08:00:00Z").estimateFrom).toBeNull();
  });

  it("knows leap years", () => {
    expect(taxYearEndISO("2027/28")).toBe("2028-02-29");
    expect(taxYearEndISO("2026/27")).toBe("2027-02-28");
  });

  it("says the claim is an estimate, and when the final reading is due", () => {
    const note = vehicleClaimNote([fuel({ vehicle_id: "a" })], latest("2026-11-25T10:00:00Z"), "2026/27");
    expect(note).toContain("estimate from your odometer reading on 25 November 2026");
    expect(note).toContain("28 February 2027");
    expect(filingChecks([fuel({ vehicle_id: "a" })], latest("2026-11-25T10:00:00Z")))
      .toContainEqual({ kind: "logbookEstimate", readingDate: "2026-11-25", yearEnd: "2027-02-28" });
  });

  it("says how much is waiting when there's no second reading", () => {
    const none = vehicleLogbook([], [{ vehicleId: "a", openingKm: 176_014, closingKm: null }], true, "2026/27");
    // en-ZA groups thousands with a non-breaking space.
    expect(vehicleClaimNote([fuel({ amount: 4207.24 })], none, "2026/27")?.replace(/\s/g, " ")).toBe(
      "R 4 207 of vehicle costs isn't included yet. Add your latest odometer reading on your vehicle to include an estimate.",
    );
  });

  it("says nothing without vehicle costs, or for an employee", () => {
    expect(vehicleClaimNote([], latest("2026-11-25T10:00:00Z"), "2026/27")).toBeNull();
    const employee = vehicleLogbook([], [], false, "2026/27");
    expect(vehicleClaimNote([fuel()], employee, "2026/27")).toBeNull();
  });
});
