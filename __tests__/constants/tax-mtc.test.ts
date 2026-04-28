import {
  calculateAnnualMTC,
  MTC_MAIN_MONTHLY,
  MTC_DEPENDANT_MONTHLY,
} from "@/constants/tax";

// ─── calculateAnnualMTC ────────────────────────────────────────────────────────

describe("calculateAnnualMTC", () => {
  it("returns correct annual credit for member-only (0 dependants)", () => {
    // R364/month × 12 = R4 368
    expect(calculateAnnualMTC(0)).toBe(MTC_MAIN_MONTHLY * 12);
  });

  it("returns correct annual credit for 1 dependant", () => {
    // (R364 + R246) × 12 = R7 320
    expect(calculateAnnualMTC(1)).toBe((MTC_MAIN_MONTHLY + MTC_DEPENDANT_MONTHLY) * 12);
  });

  it("returns correct annual credit for 2 dependants", () => {
    // (R364 + 2×R246) × 12 = R10 272
    expect(calculateAnnualMTC(2)).toBe((MTC_MAIN_MONTHLY + 2 * MTC_DEPENDANT_MONTHLY) * 12);
  });

  it("SARS 2024/25: main member monthly rate is R364", () => {
    expect(MTC_MAIN_MONTHLY).toBe(364);
  });

  it("SARS 2024/25: dependant monthly rate is R246", () => {
    expect(MTC_DEPENDANT_MONTHLY).toBe(246);
  });

  it("result is always a whole number (no fractional cents)", () => {
    expect(Number.isInteger(calculateAnnualMTC(0))).toBe(true);
    expect(Number.isInteger(calculateAnnualMTC(3))).toBe(true);
  });

  it("scales linearly with each additional dependant", () => {
    const base = calculateAnnualMTC(0);
    const oneExtra = calculateAnnualMTC(1) - base;
    const twoExtra = calculateAnnualMTC(2) - base;
    expect(twoExtra).toBe(oneExtra * 2);
  });
});
