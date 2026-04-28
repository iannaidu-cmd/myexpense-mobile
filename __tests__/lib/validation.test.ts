import {
  validateAmount,
  validateCategory,
  validateDate,
  validateIncomeSource,
  validateNote,
  validateVendor,
  firstError,
  MAX_AMOUNT,
  MAX_VENDOR_LENGTH,
  MAX_NOTE_LENGTH,
} from "@/lib/validation";

// ─── validateAmount ───────────────────────────────────────────────────────────

describe("validateAmount", () => {
  it("rejects empty string", () => {
    expect(validateAmount("")).not.toBeNull();
  });

  it("rejects whitespace-only string", () => {
    expect(validateAmount("   ")).not.toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(validateAmount("abc")).not.toBeNull();
  });

  it("rejects zero", () => {
    expect(validateAmount("0")).not.toBeNull();
  });

  it("rejects negative amount", () => {
    expect(validateAmount("-1")).not.toBeNull();
  });

  it("rejects amount exceeding SARS ceiling", () => {
    expect(validateAmount("10000000")).not.toBeNull();
  });

  it("accepts exact SARS ceiling (9,999,999.99)", () => {
    expect(validateAmount(String(MAX_AMOUNT))).toBeNull();
  });

  it("rejects more than 2 decimal places", () => {
    expect(validateAmount("1.234")).not.toBeNull();
  });

  it("accepts valid integer amount", () => {
    expect(validateAmount("1250")).toBeNull();
  });

  it("accepts valid decimal amount", () => {
    expect(validateAmount("1250.50")).toBeNull();
  });

  it("accepts amount with leading whitespace", () => {
    expect(validateAmount("  500.00  ")).toBeNull();
  });
});

// ─── validateDate ─────────────────────────────────────────────────────────────

describe("validateDate", () => {
  it("rejects empty string", () => {
    expect(validateDate("")).not.toBeNull();
  });

  it("rejects wrong format (DD/MM/YYYY)", () => {
    expect(validateDate("28/04/2025")).not.toBeNull();
  });

  it("rejects impossible date (Feb 30)", () => {
    expect(validateDate("2025-02-30")).not.toBeNull();
  });

  it("rejects future date by default", () => {
    expect(validateDate("2099-12-31")).not.toBeNull();
  });

  it("accepts future date when allowFuture is true", () => {
    expect(validateDate("2099-12-31", { allowFuture: true })).toBeNull();
  });

  it("accepts a valid past date", () => {
    expect(validateDate("2024-07-15")).toBeNull();
  });

  it("uses custom fieldName in error message", () => {
    const error = validateDate("", { fieldName: "Trip date" });
    expect(error).toContain("Trip date");
  });
});

// ─── validateVendor ───────────────────────────────────────────────────────────

describe("validateVendor", () => {
  it("rejects empty string", () => {
    expect(validateVendor("")).not.toBeNull();
  });

  it("rejects whitespace-only string", () => {
    expect(validateVendor("   ")).not.toBeNull();
  });

  it("rejects vendor exceeding max length", () => {
    expect(validateVendor("A".repeat(MAX_VENDOR_LENGTH + 1))).not.toBeNull();
  });

  it("accepts valid vendor name", () => {
    expect(validateVendor("Woolworths")).toBeNull();
  });

  it("accepts vendor at exact max length", () => {
    expect(validateVendor("A".repeat(MAX_VENDOR_LENGTH))).toBeNull();
  });
});

// ─── validateNote ─────────────────────────────────────────────────────────────

describe("validateNote", () => {
  it("accepts empty note (optional field)", () => {
    expect(validateNote("")).toBeNull();
  });

  it("rejects note exceeding max length", () => {
    expect(validateNote("A".repeat(MAX_NOTE_LENGTH + 1))).not.toBeNull();
  });

  it("accepts note at exact max length", () => {
    expect(validateNote("A".repeat(MAX_NOTE_LENGTH))).toBeNull();
  });
});

// ─── validateCategory ─────────────────────────────────────────────────────────

describe("validateCategory", () => {
  it("rejects empty string", () => {
    expect(validateCategory("")).not.toBeNull();
  });

  it("rejects unknown category", () => {
    expect(validateCategory("Gambling")).not.toBeNull();
  });

  it("accepts a valid ITR12 category", () => {
    expect(validateCategory("Travel & Transport")).toBeNull();
  });

  it("accepts Personal / Non-deductible", () => {
    expect(validateCategory("Personal / Non-deductible")).toBeNull();
  });
});

// ─── validateIncomeSource ─────────────────────────────────────────────────────

describe("validateIncomeSource", () => {
  it("rejects empty string", () => {
    expect(validateIncomeSource("")).not.toBeNull();
  });

  it("rejects unknown income source", () => {
    expect(validateIncomeSource("Lottery winnings")).not.toBeNull();
  });

  it("accepts a valid income source", () => {
    expect(validateIncomeSource("Consulting")).toBeNull();
  });
});

// ─── firstError ───────────────────────────────────────────────────────────────

describe("firstError", () => {
  it("returns null when all checks pass", () => {
    expect(firstError(null, null, null)).toBeNull();
  });

  it("returns the first non-null error", () => {
    expect(firstError(null, "Amount error", "Date error")).toBe("Amount error");
  });

  it("returns single error when only one fails", () => {
    expect(firstError(null, null, "Category error")).toBe("Category error");
  });
});
