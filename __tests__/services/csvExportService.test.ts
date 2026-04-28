// Mock Supabase before any imports that transitively require it
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn(), onAuthStateChange: jest.fn() },
  },
}));

import { generateCSV } from "@/services/csvExportService";
import type { Expense } from "@/types/database";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "1",
    user_id: "user-1",
    vendor: "Test Vendor",
    amount: 1000,
    currency: "ZAR",
    category: "Professional Fees",
    itr12_code: null,
    tax_year: "2024/25",
    expense_date: "2024-07-15",
    is_deductible: true,
    vat_amount: null,
    notes: null,
    receipt_url: null,
    storage_path: null,
    ocr_raw: null,
    created_at: "2024-07-15T10:00:00Z",
    updated_at: "2024-07-15T10:00:00Z",
    ...overrides,
  };
}

// ─── generateCSV ──────────────────────────────────────────────────────────────

describe("generateCSV", () => {
  it("starts with UTF-8 BOM for Excel compatibility", () => {
    const csv = generateCSV([makeExpense()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("includes correct header columns", () => {
    const csv = generateCSV([makeExpense()]);
    const header = csv.split("\r\n")[0]; // BOM is prepended to this line, not its own line
    expect(header).toContain("Date");
    expect(header).toContain("Vendor");
    expect(header).toContain("Category");
    expect(header).toContain("ITR12 Code");
    expect(header).toContain("Amount (ZAR)");
    expect(header).toContain("VAT Amount (ZAR)");
    expect(header).toContain("Deductible (Y/N)");
    expect(header).toContain("Receipt Attached");
    expect(header).toContain("Tax Year");
  });

  it("formats amount to 2 decimal places", () => {
    const csv = generateCSV([makeExpense({ amount: 1500 })]);
    expect(csv).toContain("1500.00");
  });

  it("marks deductible expense as Y", () => {
    const csv = generateCSV([makeExpense({ is_deductible: true })]);
    const dataRow = csv.split("\r\n")[1]; // [0] = BOM+header, [1] = first data row
    expect(dataRow).toContain(",Y,");
  });

  it("marks non-deductible expense as N", () => {
    const csv = generateCSV([makeExpense({ is_deductible: false })]);
    const dataRow = csv.split("\r\n")[1];
    expect(dataRow).toContain(",N,");
  });

  it("marks receipt as Y when receipt_url is present", () => {
    const csv = generateCSV([makeExpense({ receipt_url: "https://example.com/receipt.jpg" })]);
    expect(csv).toContain(",Y,");
  });

  it("marks receipt as N when receipt_url is null", () => {
    const csv = generateCSV([makeExpense({ receipt_url: null })]);
    const dataRow = csv.split("\r\n")[1];
    expect(dataRow).toContain(",N,");
  });

  it("includes VAT amount when present", () => {
    const csv = generateCSV([makeExpense({ vat_amount: 130.50 })]);
    expect(csv).toContain("130.50");
  });

  it("leaves VAT field empty when vat_amount is null", () => {
    const csv = generateCSV([makeExpense({ vat_amount: null })]);
    // two consecutive commas indicate empty field
    expect(csv).toContain(",,");
  });

  it("sorts expenses newest-first", () => {
    const older = makeExpense({ id: "1", expense_date: "2024-01-01", vendor: "OldVendor" });
    const newer = makeExpense({ id: "2", expense_date: "2024-06-01", vendor: "NewVendor" });
    const csv = generateCSV([older, newer]);
    const rows = csv.split("\r\n");
    const firstDataRow = rows[1]; // [0] = BOM+header, [1] = newest row
    expect(firstDataRow).toContain("NewVendor");
  });

  it("escapes commas in vendor name with quotes", () => {
    const csv = generateCSV([makeExpense({ vendor: "Smith, Jones & Co" })]);
    expect(csv).toContain('"Smith, Jones & Co"');
  });

  it("escapes double-quotes inside fields", () => {
    const csv = generateCSV([makeExpense({ notes: 'He said "hello"' })]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("returns only header when expenses array is empty", () => {
    const csv = generateCSV([]);
    const lines = csv.split("\r\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(1); // header only
  });

  it("uses itr12_code when provided, ignores category lookup", () => {
    const csv = generateCSV([makeExpense({ itr12_code: "4022" })]);
    expect(csv).toContain("4022");
  });
});
