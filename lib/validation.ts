// ─── Input Validation ─────────────────────────────────────────────────────────
// Central validation for all user-facing forms.
// Returns null on success, or an error string to show the user.
// ─────────────────────────────────────────────────────────────────────────────

import { CATEGORIES } from "@/constants/categories";

// SARS max realistic annual expense — hard ceiling
export const MAX_AMOUNT = 9_999_999.99;
export const MAX_AMOUNT_CENTS = 999_999_999; // for cents-based keypad

// Text field limits
export const MAX_VENDOR_LENGTH = 200;
export const MAX_NOTE_LENGTH = 500;
export const MAX_SOURCE_LENGTH = 200;

// ── Amount (decimal string, e.g. "1250.00") ───────────────────────────────────
export function validateAmount(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Amount is required.";

  const num = parseFloat(trimmed);
  if (isNaN(num)) return "Please enter a valid amount.";
  if (num <= 0) return "Amount must be greater than zero.";
  if (num > MAX_AMOUNT)
    return `Amount cannot exceed R ${MAX_AMOUNT.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}.`;

  // At most 2 decimal places
  const parts = trimmed.split(".");
  if (parts[1] && parts[1].length > 2)
    return "Amount can have at most 2 decimal places.";

  return null;
}

// ── Date (YYYY-MM-DD, no future dates for expenses) ───────────────────────────
export function validateDate(
  value: string,
  opts: { allowFuture?: boolean; fieldName?: string } = {},
): string | null {
  const { allowFuture = false, fieldName = "Date" } = opts;
  const trimmed = value.trim();
  if (!trimmed) return `${fieldName} is required.`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed))
    return `${fieldName} must be in YYYY-MM-DD format.`;

  const parsed = new Date(trimmed);
  // new Date("2024-02-30") → Invalid Date or rolled-over date; detect both
  if (isNaN(parsed.getTime()))
    return `${fieldName} is not a valid date.`;

  // Verify the date didn't roll over (e.g. Feb 30 → Mar 1)
  const [year, month, day] = trimmed.split("-").map(Number);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  )
    return `${fieldName} is not a valid date.`;

  if (!allowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsed > today) return `${fieldName} cannot be in the future.`;
  }

  return null;
}

// ── Non-negative amount (can legitimately be 0, unlike validateAmount which
// rejects <=0 for expense amounts — used for tax-liability inputs like
// other taxable income, medical aid contributions, tax already paid) ─────────
export function validateNonNegativeAmount(value: string, fieldName = "Amount"): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${fieldName} is required.`;

  const num = parseFloat(trimmed);
  if (isNaN(num)) return `Please enter a valid ${fieldName.toLowerCase()}.`;
  if (num < 0) return `${fieldName} cannot be negative.`;
  if (num > MAX_AMOUNT)
    return `${fieldName} cannot exceed R ${MAX_AMOUNT.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}.`;

  const parts = trimmed.split(".");
  if (parts[1] && parts[1].length > 2)
    return `${fieldName} can have at most 2 decimal places.`;

  return null;
}

// ── Date of birth (YYYY-MM-DD, no future dates, plausible age range) ──────────
export function validateDateOfBirth(value: string): string | null {
  const dateError = validateDate(value, { allowFuture: false, fieldName: "Date of birth" });
  if (dateError) return dateError;

  const dob = new Date(value.trim());
  const ageInYears = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageInYears < 16) return "Date of birth implies an age under 16.";
  if (ageInYears > 120) return "Please check the date of birth.";

  return null;
}

// ── Vendor / text fields ──────────────────────────────────────────────────────
export function validateVendor(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Vendor / supplier is required.";
  if (trimmed.length > MAX_VENDOR_LENGTH)
    return `Vendor must be ${MAX_VENDOR_LENGTH} characters or fewer.`;
  return null;
}

export function validateNote(value: string): string | null {
  if (value.length > MAX_NOTE_LENGTH)
    return `Note must be ${MAX_NOTE_LENGTH} characters or fewer.`;
  return null;
}

export function validateSource(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Income source is required.";
  if (trimmed.length > MAX_SOURCE_LENGTH)
    return `Source must be ${MAX_SOURCE_LENGTH} characters or fewer.`;
  return null;
}

// ── Category (must be from the canonical SARS list) ───────────────────────────
// Derived from constants/categories.ts — the single source of truth — rather
// than a separately hand-maintained list. This used to drift (missing
// "Retirement Annuity" entirely, stale labels like "Telephone & Cell"
// instead of "Telephone & Internet"), which silently blocked logging an RA
// expense from the main Add Expense tab.
const VALID_EXPENSE_CATEGORIES = new Set(CATEGORIES.map((c) => c.label));

export function validateCategory(value: string): string | null {
  if (!value) return "Category is required.";
  if (!VALID_EXPENSE_CATEGORIES.has(value))
    return "Please select a valid ITR12 category.";
  return null;
}

const VALID_INCOME_SOURCES = new Set([
  "Income of Employment (Salary / Wage)",
  "Fees from Companies / CC for Services Rendered",
  "Commission",
  "Rental Income",
  "Other",
  "Consulting",
  "Cost of Goods Sold",
  "Delivery Expenses",
  "Interest Received",
  "Petrol Allowance",
  "Car Allowance",
  "Bonuses",
  "Overtime",
  "Fringe Benefits",
  "Income or Profits (Beneficiary of a Trust)",
  "Cell Phone Allowance",
  "Investment Income",
  "Income of Royalties",
  "Annuities",
]);

export function validateIncomeSource(value: string): string | null {
  if (!value) return "Income source is required.";
  if (!VALID_INCOME_SOURCES.has(value))
    return "Please select a valid income source.";
  return null;
}

// ── Convenience: collect all errors into one message ─────────────────────────
export function firstError(
  ...checks: Array<string | null>
): string | null {
  return checks.find((e) => e !== null) ?? null;
}
