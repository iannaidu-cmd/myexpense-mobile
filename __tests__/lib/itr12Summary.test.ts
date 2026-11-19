import {
  assessmentPeriod,
  buildExpenditure,
  buildIncome,
  businessResult,
  canonicalCategory,
  classifyIncome,
  filingChecks,
  guessSarsField,
  validSarsField,
  maskCardNumbers,
  sarsFieldFor,
  SARS_EXPENDITURE_FIELDS,
  yearOfAssessment,
} from "@/lib/itr12Summary";

const exp = (category: string, amount: number, extra: Record<string, unknown> = {}) => ({
  category,
  amount,
  is_deductible: true,
  vendor: "Vendor",
  expense_date: "2026-04-01",
  ...extra,
});

describe("sarsFieldFor", () => {
  it("maps canonical categories to ITR12 fields", () => {
    expect(sarsFieldFor({ category: "Telephone & Internet" })).toBe("Telephone");
    expect(sarsFieldFor({ category: "Bank Charges" })).toBe("Bank Charges");
    expect(sarsFieldFor({ category: "Software & Subscriptions" })).toBe("Other");
    expect(sarsFieldFor({ category: "Equipment & Tools" })).toBe("Depreciation");
  });

  it("maps old category names instead of falling back to Other", () => {
    expect(canonicalCategory("Telephone & Cell")).toBe("Telephone & Internet");
    expect(sarsFieldFor({ category: "Telephone & Cell" })).toBe("Telephone");
    expect(sarsFieldFor({ category: "Advertising & Marketing" })).toBe("Other");
  });

  it("puts the vehicle wear-and-tear row under Depreciation", () => {
    expect(sarsFieldFor({ category: "Vehicle Expenses", wear_and_tear_vehicle_id: "v1" })).toBe("Depreciation");
  });

  it("keeps retirement annuity and personal out of business expenditure", () => {
    expect(sarsFieldFor({ category: "Retirement Annuity" })).toBeNull();
    expect(sarsFieldFor({ category: "Personal / Other" })).toBeNull();
  });

  it("only returns real ITR12 field labels", () => {
    for (const c of ["Travel & Transport", "Home Office", "Utilities", "Rent", "Insurance", "Unknown thing"]) {
      expect(SARS_EXPENDITURE_FIELDS).toContain(sarsFieldFor({ category: c }));
    }
  });
});

describe("buildExpenditure", () => {
  it("groups by field in form order, with whole rands per field", () => {
    const s = buildExpenditure(
      [
        exp("Software & Subscriptions", 100.4),
        exp("Marketing & Advertising", 50.4),
        exp("Advertising & Marketing", 10),
        exp("Bank Charges", 9.5),
        exp("Telephone & Cell", 20),
      ],
      false,
    );
    expect(s.rows.map((r) => r.field)).toEqual(["Bank Charges", "Telephone", "Other"]);
    const other = s.rows.find((r) => r.field === "Other")!;
    expect(other.amount).toBeCloseTo(160.8);
    expect(other.rands).toBe(161);
    // Old and new marketing names merge into one detail line.
    expect(other.categories.map((c) => c.category)).toEqual(["Software & Subscriptions", "Marketing & Advertising"]);
    expect(s.otherDescription).toBe("Software and subscriptions, advertising and marketing");
    expect(s.totalRands).toBe(10 + 20 + 161);
  });

  it("separates retirement annuity and not-claimable spending", () => {
    const s = buildExpenditure(
      [exp("Retirement Annuity", 500), exp("Bank Charges", 5), { ...exp("Personal / Other", 70), is_deductible: false }],
      false,
    );
    expect(s.total).toBe(5);
    expect(s.retirementAnnuity).toEqual({ amount: 500, count: 1 });
    expect(s.notClaimable).toEqual({ amount: 70, count: 1 });
  });

  it("adds the home office setup amount to Rental Paid", () => {
    const s = buildExpenditure([], false, 1200);
    expect(s.rows).toEqual([
      { field: "Rental Paid", amount: 1200, rands: 1200, categories: [{ category: "Home Office", amount: 1200, count: 0, fromSetup: true }] },
    ]);
  });

  it("takes claimable VAT off for a VAT vendor", () => {
    const s = buildExpenditure([exp("Bank Charges", 115, { vat_amount: 15 })], true);
    expect(s.total).toBe(100);
  });
});

describe("income", () => {
  it("classifies income for the business section", () => {
    expect(classifyIncome({ amount: 1, source: "Consulting" })).toBe("turnover");
    expect(classifyIncome({ amount: 1, source: "Fees from Companies / CC for Services Rendered" })).toBe("turnover");
    expect(classifyIncome({ amount: 1, source: "Income of Employment (Salary / Wage)" })).toBe("employment");
    expect(classifyIncome({ amount: 1, source: "Interest Received" })).toBe("otherSection");
    expect(classifyIncome({ amount: 1, source: "Rental Income" })).toBe("otherSection");
    expect(classifyIncome({ amount: 1, source: "Other", recoupment_vehicle_id: "v1" })).toBe("recoupment");
  });

  it("works down the page to taxable profit", () => {
    const income = buildIncome([
      { amount: 1000.6, source: "Consulting" },
      { amount: 400, source: "Income of Employment (Salary / Wage)" },
      { amount: 50, source: "Other", recoupment_vehicle_id: "v1" },
    ]);
    const exp1 = buildExpenditure([exp("Bank Charges", 100.4)], false);
    expect(businessResult(income, exp1)).toEqual({
      turnoverRands: 1001,
      grossProfitRands: 1001,
      expenditureRands: 100,
      accountingRands: 901,
      recoupmentRands: 50,
      taxableRands: 951,
    });
  });
});

describe("year of assessment", () => {
  it("uses the year the tax year ends in", () => {
    expect(yearOfAssessment("2026/27")).toBe("2027");
    expect(assessmentPeriod("2026/27")).toBe("1 March 2026 – 28 February 2027");
    expect(assessmentPeriod("2027/28")).toBe("1 March 2027 – 29 February 2028");
  });
});

describe("maskCardNumbers", () => {
  it("keeps only the last four digits of a card number", () => {
    expect(maskCardNumbers("SHOP 1234567812345678")).toBe("SHOP ****5678");
    expect(maskCardNumbers("SHOPNAME1234567812345678")).toBe("SHOPNAME****5678");
    expect(maskCardNumbers("SHOP 1234 5678 1234 5678")).toBe("SHOP ****5678");
  });

  it("leaves phone numbers and short numbers alone", () => {
    expect(maskCardNumbers("Data bundle +27820000000")).toBe("Data bundle +27820000000");
    expect(maskCardNumbers("Invoice 2026")).toBe("Invoice 2026");
    expect(maskCardNumbers(null)).toBe("");
  });
});

describe("filingChecks", () => {
  it("flags likely duplicates", () => {
    const checks = filingChecks([exp("Bank Charges", 10), exp("Bank Charges", 10), exp("Bank Charges", 11)]);
    expect(checks).toEqual([{ kind: "duplicate", vendor: "Vendor", date: "2026-04-01", amount: 10, count: 2 }]);
  });

  it("flags equipment at or over R7 000, supermarket entertainment and bond interest", () => {
    const kinds = filingChecks([
      exp("Equipment & Tools", 7000),
      exp("Equipment & Tools", 6999.99),
      exp("Meals & Entertainment", 80, { vendor: "Checkers Somewhere" }),
      exp("Interest & Finance Charges", 30, { business_use_pct: 12 }),
      exp("Interest & Finance Charges", 31),
    ]).map((c) => c.kind);
    expect(kinds).toEqual(["largeEquipment", "supermarketEntertainment", "bondInterest"]);
  });
});

describe("categories that span several ITR12 fields", () => {
  it("puts Professional Fees in the field for its type", () => {
    expect(sarsFieldFor({ category: "Professional Fees", sars_field: "Accounting Fees" })).toBe("Accounting Fees");
    expect(sarsFieldFor({ category: "Professional Fees", sars_field: "Legal Costs" })).toBe("Legal Costs");
    expect(sarsFieldFor({ category: "Professional Fees", sars_field: null })).toBe("Consulting Fees Paid");
  });

  it("splits Home Office by cost type", () => {
    expect(sarsFieldFor({ category: "Home Office", sars_field: "Electricity / Rates and Taxes" })).toBe("Electricity / Rates and Taxes");
    expect(sarsFieldFor({ category: "Home Office", sars_field: "Repairs / Maintenance" })).toBe("Repairs / Maintenance");
    expect(sarsFieldFor({ category: "Home Office", sars_field: "Other" })).toBe("Other");
    expect(sarsFieldFor({ category: "Home Office" })).toBe("Rental Paid");
  });

  it("ignores a saved field that doesn't belong to the category", () => {
    expect(validSarsField("Professional Fees", "Rental Paid")).toBeNull();
    expect(sarsFieldFor({ category: "Professional Fees", sars_field: "Rental Paid" })).toBe("Consulting Fees Paid");
    expect(sarsFieldFor({ category: "Bank Charges", sars_field: "Legal Costs" })).toBe("Bank Charges");
  });

  it("describes home office cleaning under Other", () => {
    const s = buildExpenditure([exp("Home Office", 100, { sars_field: "Other" })], false);
    expect(s.otherDescription).toBe("Home office cleaning");
  });

  it("guesses a type for bank imports", () => {
    expect(guessSarsField("Professional Fees", "SMITH ATTORNEYS")).toBe("Legal Costs");
    expect(guessSarsField("Professional Fees", "ABC Accountants")).toBe("Accounting Fees");
    expect(guessSarsField("Professional Fees", "Somebody")).toBe("Consulting Fees Paid");
    expect(guessSarsField("Home Office", "City of Somewhere rates")).toBe("Electricity / Rates and Taxes");
    expect(guessSarsField("Bank Charges", "fee")).toBeNull();
  });

  it("flags rows saved before a type was chosen", () => {
    const checks = filingChecks([exp("Professional Fees", 10), exp("Professional Fees", 11, { sars_field: "Legal Costs" })]);
    expect(checks).toEqual([
      { kind: "typeNotChosen", vendor: "Vendor", date: "2026-04-01", amount: 10, category: "Professional Fees", field: "Consulting Fees Paid" },
    ]);
  });
});
