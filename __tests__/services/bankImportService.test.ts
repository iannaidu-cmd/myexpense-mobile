jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn(), auth: { getSession: jest.fn(), onAuthStateChange: jest.fn() } },
}));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: jest.fn() }));

import { parseCSV } from "@/services/bankImportService";

describe("parseCSV — FNB 'ACCOUNT TRANSACTION HISTORY' export", () => {
  // Layout of the FNB online-banking export: title + metadata lines above the
  // real header, and columns ordered Date, Amount, Balance, Description.
  const fnb = [
    "ACCOUNT TRANSACTION HISTORY",
    "",
    "Name:, A, B",
    "Account:, 123, [123]",
    "Balance:, -16200.11, 3411.92",
    "",
    "Date, Amount, Balance, Description",
    "2026/11/20, -655.00, -16200.11, #MONTHLY ACCOUNT FEE",
    "2026/11/20, 3.18, -15510.11, DR INTEREST REBATE",
    "2026/11/19, -70.00, 2206.73, GC Sandton City POS 470724*6051  17 NOV",
    "2026/11/06, -1421.00, 12978.32, SHELL VIC PROCTOR   470724*6051  04 NOV",
    "2026/11/03, 30000.00, 117402.33, INTERNET TRF FROM     KP",
    "2026/09/19, 0.00, 266750.44, EXPRESS PMT PENDING",
  ].join("\n");

  const txs = parseCSV(fnb);

  it("finds the header row below the metadata", () => {
    expect(txs).toHaveLength(5); // zero-amount row skipped
  });

  it("uses the Amount column, not Balance, and gets the sign right", () => {
    expect(txs[0]).toMatchObject({ amount: 655, type: "expense", date: "2026-11-20" });
    expect(txs[1]).toMatchObject({ amount: 3.18, type: "income" });
    expect(txs[2]).toMatchObject({ amount: 70, type: "expense" });
    expect(txs[4]).toMatchObject({ amount: 30000, type: "income" });
  });

  it("uses the Description column for the vendor", () => {
    expect(txs[0].vendor).toBe("#MONTHLY ACCOUNT FEE");
    expect(txs[0].suggestedCategory).toBe("Bank Charges");
    expect(txs[3].vendor).toMatch(/^SHELL VIC PROCTOR/);
    expect(txs[3].suggestedCategory).toBe("Vehicle Expenses");
  });
});

describe("parseCSV — FNB keyword categories", () => {
  it("categorises medical aid, electricity and FNB fee lines", () => {
    const txs = parseCSV([
      "Date, Amount, Balance, Description",
      "2026/11/20, -10037.00, 0, MOM MEDICAL AID",
      "2026/11/20, -1000.00, 0, ELECTRICITY 04905978682",
      "2026/11/20, -35.00, 0, #MONTHLY CREDIT FEE",
      "2026/10/17, -25.00, 0, #PAYMENTS BUNDLE FEE",
    ].join("\n"));
    expect(txs.map((t) => t.suggestedCategory)).toEqual(["Medical", "Utilities", "Bank Charges", "Bank Charges"]);
  });
});

describe("parseCSV — headerless layouts", () => {
  it("Nedbank: Date, Description, Amount, Balance", () => {
    const txs = parseCSV([
      "Statement",
      "02Mar2026, SHELL ROSEBANK, -500.00, 1000.00",
      "03Mar2026, SALARY, 2000.00, 3000.00",
    ].join("\n"));
    expect(txs[0]).toMatchObject({ vendor: "SHELL ROSEBANK", amount: 500, type: "expense" });
    expect(txs[1]).toMatchObject({ vendor: "SALARY", amount: 2000, type: "income" });
  });

  it("FNB with no header row: Date, Amount, Balance, Description", () => {
    const txs = parseCSV([
      "2026/11/20, -655.00, -16200.11, #MONTHLY ACCOUNT FEE",
      "2026/11/19, -70.00, 2206.73, GC Sandton City",
      "2026/11/03, 30000.00, 117402.33, INTERNET TRF FROM KP",
    ].join("\n"));
    expect(txs[0]).toMatchObject({ vendor: "#MONTHLY ACCOUNT FEE", amount: 655, type: "expense" });
    expect(txs[2]).toMatchObject({ vendor: "INTERNET TRF FROM KP", amount: 30000, type: "income" });
  });
});

describe("parseCSV — standard headered CSV still works", () => {
  it("header on line 0 with debit/credit columns", () => {
    const txs = parseCSV([
      "Date,Description,Debit,Credit,Balance",
      "15/03/2026,VODACOM,250.00,,1000.00",
      "16/03/2026,CLIENT PAYMENT,,5000.00,6000.00",
    ].join("\n"));
    expect(txs[0]).toMatchObject({ vendor: "VODACOM", amount: 250, type: "expense" });
    expect(txs[1]).toMatchObject({ vendor: "CLIENT PAYMENT", amount: 5000, type: "income" });
  });
});
