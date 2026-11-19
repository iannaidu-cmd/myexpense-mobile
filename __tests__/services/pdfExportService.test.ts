jest.mock("@/lib/supabase", () => ({ supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn() } } }));
jest.mock("expo-print", () => ({ printToFileAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(), shareAsync: jest.fn() }));

import { buildITR12HTML } from "@/services/pdfExportService";
import type { Expense } from "@/types/database";

const e = (o: Partial<Expense>): Expense => ({
  id: Math.random().toString(), user_id: "u", vendor: "Vendor", amount: 100, currency: "ZAR",
  category: "Bank Charges", itr12_code: null, tax_year: "2026/27", expense_date: "2026-04-01",
  is_deductible: true, vat_amount: null, notes: null, receipt_url: null, storage_path: null,
  ocr_raw: null, created_at: "", updated_at: "", ...o,
});

const build = (expenses: Expense[], income: any[] = []) =>
  buildITR12HTML({
    profile: { full_name: "Test User", tax_number: null, work_type: null, vat_registered: false, vat_number: null },
    taxYear: "2026/27", expenses, income, homeOfficeSetup: null,
    includeVAT: false, includePersonal: false, summaryOnly: false, taxLiabilityEstimate: null,
  });

describe("buildITR12HTML", () => {
  it("uses SARS labels and the year of assessment", () => {
    const html = build([e({})]);
    expect(html).toContain("Year of Assessment 2027");
    expect(html).toContain("1 March 2026 – 28 February 2027");
    expect(html).toContain("Taxpayer Ref");
    expect(html).toContain("ITR12 preparation summary");
    expect(html).not.toContain("Official Export");
    expect(html).not.toContain("text-transform: uppercase");
  });

  it("shows one whole-rand line per field, with the Other description", () => {
    const html = build([
      e({ category: "Software & Subscriptions", amount: 100.6 }),
      e({ category: "Advertising & Marketing", amount: 50 }),
      e({ category: "Telephone & Cell", amount: 20 }),
    ]);
    expect(html).toContain("Description relating to other: <strong>Software and subscriptions, advertising and marketing</strong>");
    expect(html).toMatch(/<td class="field">Telephone<\/td>/);
    expect(html).toContain("R&nbsp;151</td>");
  });

  it("works down to taxable profit from the user's own income", () => {
    const html = build([e({ amount: 400 })], [{ amount: 1000, source: "Consulting", category: null }]);
    expect(html).toContain("Turnover / Sales");
    expect(html).toContain("Accounting Profit");
    expect(html).toMatch(/Taxable Profit<\/td><td class="num">R&nbsp;600</);
  });

  it("leaves fields with no data blank and never prints card numbers", () => {
    const html = build([e({ vendor: "SHOP 1234567812345678" })]);
    expect(html).toContain("Leave blank");
    expect(html).not.toContain("1234567812345678");
  });
});

describe("buildITR12HTML medical section", () => {
  it("shows the medical section only when there is something to declare", () => {
    expect(build([e({})])).not.toContain("Medical section");
    const html = build([e({ category: "Medical", amount: 250, is_deductible: false, sars_field: "4034" } as any)]);
    expect(html).toContain("Qualifying medical expenses not claimed from your medical scheme (4034)");
    expect(html).toContain("Medical (4034)");
    expect(html).not.toContain("(4005)");
  });
});
