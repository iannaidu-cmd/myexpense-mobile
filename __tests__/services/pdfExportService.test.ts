// Mock Supabase and native modules before any import that pulls them in
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn(), onAuthStateChange: jest.fn() },
  },
}));
jest.mock("expo-print", () => ({ printToFileAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));
jest.mock("@/tokens", () => ({
  colour: new Proxy({}, { get: () => "#000000" }),
}));

import { getITR12Code } from "@/services/pdfExportService";

// ─── getITR12Code ─────────────────────────────────────────────────────────────

describe("getITR12Code", () => {
  it("returns the explicit itr12_code when provided", () => {
    expect(getITR12Code("Travel & Transport", "4022")).toBe("4022");
  });

  it("looks up ITR12_CATEGORIES when no explicit code supplied", () => {
    // "Equipment & Tools" maps to 4022 in ITR12_CATEGORIES
    expect(getITR12Code("Equipment & Tools", null)).toBe("4022");
  });

  it("falls back to 4011 for an unknown category with no explicit code", () => {
    expect(getITR12Code("Unknown Category", null)).toBe("4011");
  });

  it("falls back to 4011 when itr12_code is undefined", () => {
    expect(getITR12Code("Unknown Category", undefined)).toBe("4011");
  });

  it("prefers explicit code over category lookup (explicit always wins)", () => {
    // Even if the category maps to 4022, an explicit code takes priority
    expect(getITR12Code("Equipment & Tools", "9999")).toBe("9999");
  });

  it("returns correct code for Travel & Transport", () => {
    expect(getITR12Code("Travel & Transport", null)).toBe("4011");
  });

  it("returns correct code for Professional Fees", () => {
    expect(getITR12Code("Professional Fees", null)).toBe("4011");
  });
});
