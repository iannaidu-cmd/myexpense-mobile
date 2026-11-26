// Editing an expense's date must move it to the right tax year.
const mockUpdate = jest.fn();
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      update: (fields: any) => {
        mockUpdate(fields);
        return { eq: () => ({ select: () => ({ single: async () => ({ data: fields, error: null }) }) }) };
      },
    }),
  },
}));
const { expenseService } = require("@/services/expenseService");

describe("updateExpense", () => {
  beforeEach(() => mockUpdate.mockClear());

  it("re-derives tax_year from a new date", async () => {
    await expenseService.updateExpense({ id: "e1", expense_date: "2026-03-01" });
    expect(mockUpdate.mock.calls[0][0].tax_year).toBe("2026/27");
    await expenseService.updateExpense({ id: "e1", expense_date: "2026-02-28" });
    expect(mockUpdate.mock.calls[1][0].tax_year).toBe("2025/26");
  });

  it("leaves tax_year alone when the date isn't changed", async () => {
    await expenseService.updateExpense({ id: "e1", vendor: "Engen" });
    expect(mockUpdate.mock.calls[0][0]).not.toHaveProperty("tax_year");
  });
});
