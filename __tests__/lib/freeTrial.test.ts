import {
  formatTrialLength,
  isStoreTrial,
  trialDays,
  trialFromAndroidOption,
  trialFromIosIntro,
  trialHeadline,
  trialTerms,
} from "@/lib/freeTrial";

const freeWeek = { price: 0, periodUnit: "WEEK", periodNumberOfUnits: 1, cycles: 1 };

describe("trialFromIosIntro", () => {
  it("free intro offer and eligible: a trial", () => {
    expect(trialFromIosIntro(freeWeek, true)).toEqual({ unit: "WEEK", count: 1 });
  });

  it("not eligible (already used, or eligibility unknown): no trial", () => {
    expect(trialFromIosIntro(freeWeek, false)).toBeNull();
  });

  it("no intro offer configured: no trial", () => {
    expect(trialFromIosIntro(null, true)).toBeNull();
    expect(trialFromIosIntro(undefined, true)).toBeNull();
  });

  it("a paid intro price is not a free trial", () => {
    expect(trialFromIosIntro({ ...freeWeek, price: 49 }, true)).toBeNull();
  });

  it("multiplies the period by its cycles", () => {
    expect(trialFromIosIntro({ price: 0, periodUnit: "DAY", periodNumberOfUnits: 7, cycles: 1 }, true)).toEqual({
      unit: "DAY",
      count: 7,
    });
    expect(trialFromIosIntro({ price: 0, periodUnit: "MONTH", periodNumberOfUnits: 1, cycles: 2 }, true)).toEqual({
      unit: "MONTH",
      count: 2,
    });
  });

  it("unknown units or empty periods: no trial", () => {
    expect(trialFromIosIntro({ ...freeWeek, periodUnit: "UNKNOWN" }, true)).toBeNull();
    expect(trialFromIosIntro({ ...freeWeek, periodNumberOfUnits: 0 }, true)).toBeNull();
  });
});

describe("trialFromAndroidOption", () => {
  it("option with a free phase: a trial", () => {
    const option = { freePhase: { billingPeriod: { unit: "DAY", value: 7 }, billingCycleCount: 1 } };
    expect(trialFromAndroidOption(option)).toEqual({ unit: "DAY", count: 7 });
  });

  it("base plan only (no free phase, or not eligible): no trial", () => {
    expect(trialFromAndroidOption({ freePhase: null })).toBeNull();
    expect(trialFromAndroidOption(null)).toBeNull();
    expect(trialFromAndroidOption(undefined)).toBeNull();
  });

  it("a null cycle count counts once", () => {
    const option = { freePhase: { billingPeriod: { unit: "WEEK", value: 1 }, billingCycleCount: null } };
    expect(trialFromAndroidOption(option)).toEqual({ unit: "WEEK", count: 1 });
  });
});

describe("formatTrialLength", () => {
  it("reads weeks as days", () => {
    expect(formatTrialLength({ unit: "WEEK", count: 1 })).toBe("7 days");
    expect(formatTrialLength({ unit: "WEEK", count: 2 })).toBe("14 days");
  });

  it("singular and plural", () => {
    expect(formatTrialLength({ unit: "DAY", count: 1 })).toBe("1 day");
    expect(formatTrialLength({ unit: "DAY", count: 3 })).toBe("3 days");
    expect(formatTrialLength({ unit: "MONTH", count: 1 })).toBe("1 month");
    expect(formatTrialLength({ unit: "YEAR", count: 2 })).toBe("2 years");
  });
});

describe("trialHeadline", () => {
  it("trial length, then the store price for the period", () => {
    expect(trialHeadline({ unit: "DAY", count: 7 }, "{price}", "monthly")).toBe("7 days free, then {price} per month");
    expect(trialHeadline({ unit: "WEEK", count: 1 }, "{price}", "annual")).toBe("7 days free, then {price} per year");
  });
});

describe("trialTerms", () => {
  const trial = { unit: "DAY" as const, count: 7 };

  it("states the length, the price afterwards and that it renews", () => {
    for (const platform of ["ios", "android"] as const) {
      const t = trialTerms(trial, "{price}", "monthly", platform);
      expect(t).toContain("Free for 7 days, then {price} per month.");
      expect(t).toContain("renews automatically until you cancel");
    }
  });

  it("says where to cancel on each store", () => {
    expect(trialTerms(trial, "{price}", "annual", "ios")).toContain("App Store settings");
    expect(trialTerms(trial, "{price}", "annual", "ios")).toContain("24 hours before the trial ends");
    expect(trialTerms(trial, "{price}", "annual", "android")).toContain("Google Play");
  });

  it("never uses em dashes", () => {
    expect(trialTerms(trial, "{price}", "monthly", "ios")).not.toMatch(/—/);
    expect(trialTerms(trial, "{price}", "monthly", "android")).not.toMatch(/—/);
  });
});

describe("isStoreTrial", () => {
  it("only a TRIAL period type is a store trial", () => {
    expect(isStoreTrial({ periodType: "TRIAL" })).toBe(true);
    expect(isStoreTrial({ periodType: "NORMAL" })).toBe(false);
    expect(isStoreTrial({ periodType: "INTRO" })).toBe(false);
    expect(isStoreTrial(null)).toBe(false);
    expect(isStoreTrial(undefined)).toBe(false);
  });
});

describe("trialDays", () => {
  it("whole days for tracking", () => {
    expect(trialDays({ unit: "WEEK", count: 1 })).toBe(7);
    expect(trialDays({ unit: "DAY", count: 7 })).toBe(7);
    expect(trialDays(null)).toBeNull();
  });
});
