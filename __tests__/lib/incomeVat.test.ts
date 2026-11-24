import { buildIncome, incomeToCheckForVat } from "@/lib/itr12Summary";
import { incomeExVat, incomeVat, vatInInclusive } from "@/lib/vat";

describe("VAT on income", () => {
  it("takes 15/115 out of a VAT-inclusive amount, to the cent", () => {
    expect(vatInInclusive(1150)).toBe(150);
    expect(vatInInclusive(100)).toBe(13.04);
    expect(vatInInclusive(0)).toBe(0);
    expect(vatInInclusive(NaN)).toBe(0);
  });

  it("uses the amount without VAT, and treats missing VAT as none", () => {
    expect(incomeExVat({ amount: 1150, vat_amount: 150 })).toBe(1000);
    expect(incomeExVat({ amount: "500", vat_amount: null })).toBe(500);
    expect(incomeVat({ amount: 500 })).toBe(0);
  });

  it("puts only the amount without VAT into ITR12 turnover", () => {
    const s = buildIncome([
      { amount: 1150, vat_amount: 150, source: "Consulting" },
      { amount: 2000, vat_amount: 0, source: "Consulting" }, // overseas client
    ]);
    expect(s.turnover).toBe(3000);
  });

  it("asks to check only business income with no VAT marked", () => {
    const rows = [
      { id: "a", amount: 1150, vat_amount: 0, source: "Consulting" },
      { id: "b", amount: 1150, vat_amount: 150, source: "Consulting" },
      { id: "c", amount: 30000, vat_amount: 0, source: "Income of Employment (Salary / Wage)" },
      { id: "d", amount: 8000, vat_amount: 0, source: "Rental Income" },
      { id: "e", amount: 50000, vat_amount: 0, source: "Vehicle sale", recoupment_vehicle_id: "v1" },
    ];
    expect(incomeToCheckForVat(rows).map((r) => r.id)).toEqual(["a"]);
  });
});
