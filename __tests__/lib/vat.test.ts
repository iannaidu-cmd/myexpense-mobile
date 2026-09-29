// expenseService imports the Supabase client, which needs native modules.
jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

import {
  claimableInputVat,
  countsTowardVatTurnover,
  VAT_COMPULSORY_THRESHOLD,
  VAT_VOLUNTARY_THRESHOLD,
  vatNeedsReview,
} from "@/lib/vat";
import { deductibleBase } from "@/services/expenseService";

const phone = { amount: 575, vat_amount: 150, business_use_pct: 50, category: "Telephone & Internet", is_deductible: true };
const lunch = { amount: 1150, vat_amount: 150, business_use_pct: null, category: "Meals & Entertainment", is_deductible: true };
const laptop = { amount: 11500, vat_amount: 1500, business_use_pct: null, category: "Equipment & Tools", is_deductible: true };

describe("VAT thresholds (SARS, from 1 April 2026)", () => {
  it("uses R2.3 million compulsory and R120 000 voluntary", () => {
    expect(VAT_COMPULSORY_THRESHOLD).toBe(2_300_000);
    expect(VAT_VOLUNTARY_THRESHOLD).toBe(120_000);
  });
});

describe("claimableInputVat", () => {
  it("claims only the business share of a partly-private cost", () => {
    expect(claimableInputVat(phone)).toBe(75);
  });

  it("never claims VAT on entertainment", () => {
    expect(claimableInputVat(lunch)).toBe(0);
  });

  it("claims all the VAT on a fully-business cost", () => {
    expect(claimableInputVat(laptop)).toBe(1500);
  });

  it("claims nothing on a personal cost", () => {
    expect(claimableInputVat({ ...laptop, is_deductible: false })).toBe(0);
  });
});

describe("deductibleBase for a VAT vendor", () => {
  it("takes off only the VAT that can be claimed on an apportioned cost", () => {
    // R1 150 incl. R150 VAT at 50%: (1 150 − 150) × 50% = R500
    expect(deductibleBase(phone, true)).toBe(500);
  });

  it("keeps VAT that can't be claimed (entertainment) in the cost", () => {
    expect(deductibleBase(lunch, true)).toBe(1150);
  });

  it("leaves non-vendors' amounts alone", () => {
    expect(deductibleBase(phone, false)).toBe(575);
  });
});

describe("vatNeedsReview", () => {
  it("flags older partly-business entries with no saved share", () => {
    expect(vatNeedsReview({ ...phone, business_use_pct: null })).toBe(true);
    expect(vatNeedsReview(phone)).toBe(false);
    expect(vatNeedsReview(laptop)).toBe(false);
  });
});

describe("countsTowardVatTurnover", () => {
  it("leaves out employment income and the vehicle-sale row", () => {
    expect(countsTowardVatTurnover({ source: "IRP5 / Employment Income", category: "IRP5" })).toBe(false);
    expect(countsTowardVatTurnover({ source: "Income of Employment (Salary / Wage)", category: "Salary / Wage" })).toBe(false);
    expect(countsTowardVatTurnover({ source: "Added back on sale", category: "Other", recoupment_vehicle_id: "v1" })).toBe(false);
    expect(countsTowardVatTurnover({ source: "Fees from Companies / CC for Services Rendered", category: "Freelance" })).toBe(true);
  });
});
