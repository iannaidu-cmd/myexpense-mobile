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

// ─── Layouts used by other SA banks ──────────────────────────────────────────
// Reconstructed from the banks' known export layouts. Each checks the same
// failure mode as the FNB bug: right description, right amount (not balance),
// right expense/income direction.

const brief = (txs: ReturnType<typeof parseCSV>) =>
  txs.map((t) => [t.date, t.type, t.amount, t.vendor].join(" | "));

describe("parseCSV — other banks", () => {
  it("Standard Bank: HIST rows, YYYYMMDD, OPEN/CLOSE metadata, no header", () => {
    const txs = parseCSV([
      "ACC-NO,012345678,CURRENT ACCOUNT",
      "OPEN,20261001,,5000.00,OPENING BALANCE,,5000.00",
      "HIST,20261002,,-150.00,PURCHASE,SHELL ROSEBANK,4850.00,",
      "HIST,20261003,,2000.00,CREDIT TRANSFER,CLIENT ABC,6850.00,",
      "HIST,20261004,,-35.00,MONTHLY FEE,,6815.00,",
      "CLOSE,20261031,,6815.00,CLOSING BALANCE,,6815.00",
    ].join("\n"));
    expect(brief(txs)).toEqual([
      "2026-10-02 | expense | 150 | PURCHASE SHELL ROSEBANK",
      "2026-10-03 | income | 2000 | CREDIT TRANSFER CLIENT ABC",
      "2026-10-04 | expense | 35 | MONTHLY FEE",
    ]);
    expect(txs[0].suggestedCategory).toBe("Vehicle Expenses");
  });

  it("Capitec: Money In / Money Out (negative) / Fee columns, date with time", () => {
    const txs = parseCSV([
      "Nr,Account,Posting Date,Transaction Date,Description,Original Description,Parent Category,Category,Money In,Money Out,Fee,Balance",
      "1,1234567890,2026/10/02,2026/10/01 14:32,Vodacom,VODACOM PREPAID,Bills,Cellphone,,-99.00,-1.50,4899.50",
      "2,1234567890,2026/10/03,2026/10/03 09:00,Client Payment,CLIENT ABC,Income,Salary,2500.00,,,7399.50",
    ].join("\n"));
    expect(brief(txs)).toEqual([
      // Transaction Date (day of purchase) is used; clean Description only.
      "2026-10-01 | expense | 99 | Vodacom",
      "2026-10-01 | expense | 1.5 | Vodacom fee",
      "2026-10-03 | income | 2500 | Client Payment",
    ]);
    expect(txs[0].suggestedCategory).toBe("Telephone & Internet");
    expect(txs[1].suggestedCategory).toBe("Bank Charges");
  });

  it("ABSA: Date, Description, Amount, Balance with DD/MM/YYYY", () => {
    const txs = parseCSV([
      "Transaction Date,Description,Amount,Balance",
      "02/10/2026,DEBIT ORDER TELKOM,-450.00,1000.00",
      "03/10/2026,ACB CREDIT CLIENT,3000.00,4000.00",
    ].join("\n"));
    expect(brief(txs)).toEqual([
      "2026-10-02 | expense | 450 | DEBIT ORDER TELKOM",
      "2026-10-03 | income | 3000 | ACB CREDIT CLIENT",
    ]);
  });

  it("Nedbank: headerless with metadata block, DDMmmYYYY", () => {
    const txs = parseCSV([
      "Statement Enquiry",
      "Account Number,1234567890",
      "Statement period, 2026/09/18, 2026/11/20",
      "02Oct2026,ENGEN RANDBURG,-600.00,4400.00",
      "03Oct2026,OPENING BALANCE,0.00,4400.00",
      "04Oct2026,EFT CLIENT XYZ,1500.00,5900.00",
    ].join("\n"));
    expect(brief(txs)).toEqual([
      "2026-10-02 | expense | 600 | ENGEN RANDBURG",
      "2026-10-04 | income | 1500 | EFT CLIENT XYZ",
    ]);
  });

  it("FNB numbered layout with Description1/2/3 and quoted dates", () => {
    const txs = parseCSV([
      "2,'Transaction History'",
      "3,'Number','Date','Description1','Description2','Description3','Amount','Balance','Accrued Charges'",
      "5,1,'02 Oct 2026','POS PURCHASE','WOOLWORTHS','470724*6051',-182.97,4817.03,0",
      "5,2,'03 Oct 2026','FNB OB PMT','CLIENT ABC','',5000.00,9817.03,0",
    ].join("\n"));
    expect(txs.map((t) => [t.type, t.amount])).toEqual([["expense", 182.97], ["income", 5000]]);
    expect(txs[0].vendor).toMatch(/^POS PURCHASE WOOLWORTHS/);
  });

  it("Investec/Discovery style: positive amounts with a Dr/Cr column", () => {
    const txs = parseCSV([
      "Date,Description,Type,Amount,Balance",
      "2026-10-02,UBER TRIP,DR,85.50,1000.00",
      "2026-10-03,CLIENT PAYMENT,CR,4000.00,5000.00",
    ].join("\n"));
    expect(brief(txs)).toEqual([
      "2026-10-02 | expense | 85.5 | UBER TRIP",
      "2026-10-03 | income | 4000 | CLIENT PAYMENT",
    ]);
  });

  it("TymeBank style: semicolon-separated, decimal commas, Money In/Out", () => {
    const txs = parseCSV([
      "Date;Description;Money In;Money Out;Fees;Balance",
      "02/10/2026;Takealot;;1 299,00;;3 701,00",
      "03/10/2026;Payment received;2 500,50;;;6 201,50",
    ].join("\n"));
    expect(brief(txs)).toEqual([
      "2026-10-02 | expense | 1299 | Takealot",
      "2026-10-03 | income | 2500.5 | Payment received",
    ]);
  });

  it("Dr/Cr suffix amounts in a single column", () => {
    const txs = parseCSV([
      "Date,Description,Amount,Balance",
      "02/10/2026,SPAR,250.00 Dr,750.00 Cr",
      "03/10/2026,DEPOSIT,1000.00 Cr,1750.00 Cr",
    ].join("\n"));
    expect(txs.map((t) => [t.type, t.amount])).toEqual([["expense", 250], ["income", 1000]]);
  });

  it("throws a clear error when no amount column exists", () => {
    expect(() => parseCSV("Date,Description,Balance\n02/10/2026,SPAR,750.00")).toThrow(/amount column/);
  });
});
