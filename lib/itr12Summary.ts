// ─── ITR12 summary rules ─────────────────────────────────────────────────────
// Pure functions (no Supabase, no React) shared by the PDF export, the CSV
// export and the in-app export preview, so all three tell the user the same
// thing. Unit tested in __tests__/lib/itr12Summary.test.ts.
//
// Sources (checked 19 Nov 2026):
// • SARS ITR12 return, "Local Business, Trade and Professional Income":
//   field labels and their order, "Rands only, no cents", "Description
//   relating to other".
// • SARS Comprehensive Guide to the ITR12 (IT-AE-36-G05):
//   - home office: interest on a bond is not deductible from the 2023 year
//     of assessment onward;
//   - wear and tear (s11(e)) / Interpretation Note 47: a small item that
//     works on its own and costs less than R7 000 can be written off in full
//     in the year it is bought; dearer items are spread over several years.
// ─────────────────────────────────────────────────────────────────────────────

import { CATEGORY_PARTIAL_CAPS, NON_DEDUCTIBLE_LABEL } from "@/constants/categories";
import { medicalTaxCreditForYear } from "@/lib/taxRules";
import { claimableInputVat, countsTowardVatTurnover, incomeExVat, incomeVat } from "@/lib/vat";
import { ITR12_CATEGORIES } from "@/types/database";

/** Expenditure fields in the order they appear on the ITR12. */
export const SARS_EXPENDITURE_FIELDS = [
  "Accounting Fees",
  "Administration Cost",
  "Bad Debts",
  "Bank Charges",
  "Capital Allowances",
  "Commission paid",
  "Consulting Fees Paid",
  "Depreciation",
  "Electricity / Rates and Taxes",
  "Entertainment",
  "Insurance",
  "Interest / Finance Charges",
  "Lease Payment",
  "Legal Costs",
  "Provision for Doubtful Debts",
  "Rental Paid",
  "Repairs / Maintenance",
  "Royalties and License Fees",
  "Salaries and Wages",
  "Telephone",
  "Travel Costs – Local",
  "Travel Costs – Foreign",
  "Other",
] as const;

export type SarsExpenditureField = (typeof SARS_EXPENDITURE_FIELDS)[number];

export const RETIREMENT_ANNUITY_CATEGORY = "Retirement Annuity";

/** SARS "small item" limit for writing equipment off in one year. */
export const SMALL_ITEM_LIMIT = 7000;

// Old category names still found on saved expenses and in some screens.
// Without this they miss the field lookup and fall back to "Other".
export const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  "Telephone & Cell": "Telephone & Internet",
  "Phone & Internet": "Telephone & Internet",
  "Advertising & Marketing": "Marketing & Advertising",
  "Computer & IT Equipment": "Equipment & Tools",
  "Fuel & Oil": "Vehicle Expenses",
  "Travel – Business": "Travel & Transport",
};

export function canonicalCategory(category: string | null | undefined): string {
  const c = (category ?? "").trim();
  return LEGACY_CATEGORY_ALIASES[c] ?? c;
}

/**
 * Categories that cover more than one ITR12 field. The user picks a type and
 * the expense's `sars_field` is saved, so the export puts it in the exact
 * field SARS uses. The first option is the default when none is saved.
 */
export interface SarsFieldType {
  label: string;
  /** Business expenditure field, or a medical source code ("4005" etc). */
  field: string;
  /** Where it goes, as shown under the picker. */
  where?: string;
  /** Shown under the picker when this type is chosen. */
  hint?: string;
}

export const SARS_FIELD_TYPES: Record<string, SarsFieldType[]> = {
  "Professional Fees": [
    { label: "Consultant or other", field: "Consulting Fees Paid" },
    { label: "Accountant or bookkeeper", field: "Accounting Fees" },
    {
      label: "Lawyer",
      field: "Legal Costs",
      hint: "Legal fees for buying a property, vehicle or business can't be claimed. Only claim legal costs for running your business.",
    },
  ],
  "Home Office": [
    { label: "Rent", field: "Rental Paid" },
    { label: "Electricity, rates and taxes", field: "Electricity / Rates and Taxes" },
    { label: "Repairs", field: "Repairs / Maintenance" },
    { label: "Cleaning", field: "Other" },
  ],
};

export const MEDICAL_CATEGORY = "Medical";

/** ITR12 medical section source codes. Default first. */
export const MEDICAL_TYPES: SarsFieldType[] = [
  {
    label: "Not claimed from medical aid",
    field: "4034",
    where: "Medical section, code 4034",
    hint: "Costs you paid yourself and didn't claim from a medical aid. Keep the receipts.",
  },
  {
    label: "Medical aid contributions",
    field: "4005",
    where: "Medical section, code 4005",
    hint: "What you pay your medical aid each month. Your medical aid's tax certificate shows the year's total.",
  },
  {
    label: "Claimed, not paid back",
    field: "4020",
    where: "Medical section, code 4020",
    hint: "Costs you claimed from your medical aid that it didn't pay. They show on your medical aid's tax certificate.",
  },
];

export const isMedicalCategory = (category: string | null | undefined) => canonicalCategory(category) === MEDICAL_CATEGORY;

/** Type options for a category, or null when it maps to one field only. */
export function sarsFieldTypes(category: string | null | undefined): SarsFieldType[] | null {
  const cat = canonicalCategory(category);
  if (cat === MEDICAL_CATEGORY) return MEDICAL_TYPES;
  return SARS_FIELD_TYPES[cat] ?? null;
}

/** The saved field if it is valid for this category, otherwise null. */
export function validSarsField(category: string | null | undefined, field: string | null | undefined): string | null {
  const types = sarsFieldTypes(category);
  return types?.find((t) => t.field === field)?.field ?? null;
}

// Best guess from a statement description, for bank imports (no picker).
const FIELD_GUESSES: Record<string, [RegExp, string][]> = {
  Medical: [
    [/discovery\s*health|bonitas|momentum\s*health|medshield|fedhealth|bestmed|\bgems\b|medihelp|keyhealth|profmed|polmed|bankmed|medical\s*aid/i, "4005"],
  ],
  "Professional Fees": [
    [/account|bookkeep|audit|tax practi|saica|sait/i, "Accounting Fees"],
    [/attorney|lawyer|legal|advocate|conveyanc|law/i, "Legal Costs"],
  ],
  "Home Office": [
    [/rent|letting|landlord/i, "Rental Paid"],
    [/eskom|electric|prepaid|municipal|rates|city of|city power/i, "Electricity / Rates and Taxes"],
    [/repair|plumb|maintenance|handyman/i, "Repairs / Maintenance"],
    [/clean|domestic|sweepsouth/i, "Other"],
  ],
};

/** The field to save for a new expense when nobody picked a type. */
export function guessSarsField(category: string, description: string | null | undefined): string | null {
  const types = sarsFieldTypes(category);
  if (!types) return null;
  const hit = FIELD_GUESSES[canonicalCategory(category)]?.find(([re]) => re.test(description ?? ""));
  return hit ? hit[1] : types[0].field;
}

interface ExpenseLike {
  id?: string;
  vendor?: string | null;
  amount: number | string;
  vat_amount?: number | string | null;
  business_use_pct?: number | string | null;
  gross_amount?: number | string | null;
  category: string;
  is_deductible: boolean;
  expense_date?: string;
  wear_and_tear_vehicle_id?: string | null;
  sars_field?: string | null;
}

/**
 * The ITR12 business expenditure field an expense belongs in, or null when it
 * isn't business expenditure (retirement annuity, personal).
 */
export function sarsFieldFor(e: Pick<ExpenseLike, "category" | "wear_and_tear_vehicle_id" | "sars_field">): SarsExpenditureField | null {
  // The yearly vehicle wear-and-tear row is an s11(e) allowance, not a running cost.
  if (e.wear_and_tear_vehicle_id) return "Depreciation";
  const cat = canonicalCategory(e.category);
  if (cat === RETIREMENT_ANNUITY_CATEGORY || cat === NON_DEDUCTIBLE_LABEL || cat === MEDICAL_CATEGORY) return null;
  const types = SARS_FIELD_TYPES[cat];
  if (types) return (validSarsField(cat, e.sars_field) ?? types[0].field) as SarsExpenditureField;
  const field = ITR12_CATEGORIES[cat]?.field;
  return (SARS_EXPENDITURE_FIELDS as readonly string[]).includes(field ?? "")
    ? (field as SarsExpenditureField)
    : "Other";
}

/** Income-tax deductible amount of one row (same rule as expenseService). */
export function claimableAmount(e: ExpenseLike, vatRegistered: boolean): number {
  if (!e.is_deductible) return 0;
  const base = vatRegistered ? Math.max(0, Number(e.amount) - claimableInputVat(e)) : Number(e.amount);
  return base * (CATEGORY_PARTIAL_CAPS[canonicalCategory(e.category)] ?? 1);
}

/** Whole rands, as eFiling wants them. */
export const toRands = (n: number) => Math.round(n);

// ─── Expenditure ─────────────────────────────────────────────────────────────

export interface FieldCategoryDetail {
  category: string;
  amount: number;
  count: number;
  /** True for the Home office setup amount (not a logged expense). */
  fromSetup?: boolean;
}

export interface FieldRow {
  field: SarsExpenditureField;
  amount: number;
  /** What to type into eFiling. */
  rands: number;
  categories: FieldCategoryDetail[];
}

export interface ExpenditureSummary {
  /** Fields with an amount, in ITR12 order. */
  rows: FieldRow[];
  total: number;
  /** Sum of the whole-rand field amounts (what eFiling will total). */
  totalRands: number;
  /** Text for "Description relating to other", or null when Other is empty. */
  otherDescription: string | null;
  retirementAnnuity: { amount: number; count: number };
  notClaimable: { amount: number; count: number };
}

const OTHER_DESCRIPTIONS: Record<string, string> = {
  "Software & Subscriptions": "software and subscriptions",
  "Marketing & Advertising": "advertising and marketing",
  "Training & Education": "training and education",
  "Home Office": "home office cleaning",
};

export function buildExpenditure(
  expenses: ExpenseLike[],
  vatRegistered: boolean,
  /** Home office setup amount (annual rent x floor ratio), 0 if none. */
  homeOfficeSetupAmount = 0,
): ExpenditureSummary {
  const byField = new Map<SarsExpenditureField, Map<string, FieldCategoryDetail>>();
  const retirementAnnuity = { amount: 0, count: 0 };
  const notClaimable = { amount: 0, count: 0 };

  const add = (field: SarsExpenditureField, category: string, amount: number, count: number, fromSetup?: boolean) => {
    const cats = byField.get(field) ?? new Map<string, FieldCategoryDetail>();
    const key = fromSetup ? `${category} (setup)` : category;
    const d = cats.get(key) ?? { category, amount: 0, count: 0, ...(fromSetup ? { fromSetup } : {}) };
    d.amount += amount;
    d.count += count;
    cats.set(key, d);
    byField.set(field, cats);
  };

  for (const e of expenses) {
    // Medical has its own ITR12 section (see medicalTotals), not personal spending.
    if (isMedicalCategory(e.category)) continue;
    if (!e.is_deductible) {
      notClaimable.amount += Number(e.amount);
      notClaimable.count += 1;
      continue;
    }
    const amount = claimableAmount(e, vatRegistered);
    const cat = canonicalCategory(e.category);
    if (cat === RETIREMENT_ANNUITY_CATEGORY) {
      retirementAnnuity.amount += amount;
      retirementAnnuity.count += 1;
      continue;
    }
    const field = sarsFieldFor(e);
    if (!field) continue;
    add(field, e.wear_and_tear_vehicle_id ? "Vehicle wear and tear" : cat, amount, 1);
  }

  if (homeOfficeSetupAmount > 0) add("Rental Paid", "Home Office", homeOfficeSetupAmount, 0, true);

  const rows: FieldRow[] = SARS_EXPENDITURE_FIELDS.flatMap((field) => {
    const cats = byField.get(field);
    if (!cats) return [];
    const categories = [...cats.values()].sort((a, b) => b.amount - a.amount);
    const amount = categories.reduce((s, c) => s + c.amount, 0);
    if (amount <= 0) return [];
    return [{ field, amount, rands: toRands(amount), categories }];
  });

  const other = rows.find((r) => r.field === "Other");
  const otherDescription = other
    ? capitalise(other.categories.map((c) => OTHER_DESCRIPTIONS[c.category] ?? c.category.toLowerCase()).join(", "))
    : null;

  return {
    rows,
    total: rows.reduce((s, r) => s + r.amount, 0),
    totalRands: rows.reduce((s, r) => s + r.rands, 0),
    otherDescription,
    retirementAnnuity,
    notClaimable,
  };
}

const capitalise = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// ─── Medical ─────────────────────────────────────────────────────────────────

export interface MedicalTotals {
  /** Code 4005: medical aid contributions logged as expenses. */
  contributions: number;
  /** Code 4020: claimed from the medical aid but not paid back. */
  claimedNotPaid: number;
  /** Code 4034: not claimed from a medical aid. */
  notClaimed: number;
  count: number;
}

/** Logged Medical expenses by ITR12 medical source code. */
export function medicalTotals(expenses: ExpenseLike[]): MedicalTotals {
  const t: MedicalTotals = { contributions: 0, claimedNotPaid: 0, notClaimed: 0, count: 0 };
  for (const e of expenses) {
    if (!isMedicalCategory(e.category)) continue;
    const code = validSarsField(MEDICAL_CATEGORY, e.sars_field) ?? MEDICAL_TYPES[0].field;
    const amt = Number(e.amount);
    if (code === "4005") t.contributions += amt;
    else if (code === "4020") t.claimedNotPaid += amt;
    else t.notClaimed += amt;
    t.count += 1;
  }
  return t;
}

/**
 * Medical aid contributions for the year: the logged 4005 expenses if there
 * are any (they are the real payments), otherwise the monthly amount from the
 * tax calculator x 12. Never both, so nothing is counted twice.
 */
export function annualMedicalContributions(t: MedicalTotals, medicalAidMonthly: number | null | undefined): number {
  if (t.contributions > 0) return t.contributions;
  return Math.max(0, Number(medicalAidMonthly ?? 0)) * 12;
}

/**
 * The s6A medical scheme fees credit for display. Only someone who actually
 * pays a medical aid gets it, so it is 0 until there are contributions
 * (logged medical aid expenses or a monthly amount). Mirrors the gate in
 * calculateTaxLiability so screens never show a credit the estimate omits.
 */
export function medicalSchemeFeesCredit(
  expenses: ExpenseLike[],
  medicalAidMonthly: number | null | undefined,
  dependants: number,
  taxYear: string,
): number {
  const contributions = annualMedicalContributions(medicalTotals(expenses), medicalAidMonthly);
  return contributions > 0 ? medicalTaxCreditForYear(dependants, taxYear) : 0;
}

// ─── Income ──────────────────────────────────────────────────────────────────

export type IncomeKind = "turnover" | "employment" | "otherSection" | "recoupment";

interface IncomeLike {
  amount: number | string;
  vat_amount?: number | string | null;
  source?: string | null;
  category?: string | null;
  recoupment_vehicle_id?: string | null;
}

// Declared in their own ITR12 sections, not as business turnover.
const OTHER_SECTION_SOURCES = /Rental Income|Interest Received|Investment Income|Beneficiary of a Trust|Annuities|Royalties/i;

export function classifyIncome(i: Omit<IncomeLike, "amount"> & { amount?: number | string }): IncomeKind {
  if (i.recoupment_vehicle_id) return "recoupment";
  if (!countsTowardVatTurnover(i)) return "employment";
  if (OTHER_SECTION_SOURCES.test(`${i.source ?? ""} ${i.category ?? ""}`)) return "otherSection";
  return "turnover";
}

export interface IncomeSummary {
  turnover: number;
  employment: number;
  otherSection: number;
  recoupment: number;
  /** Other-section income by source, for the "declared elsewhere" note. */
  otherSectionBySource: Record<string, number>;
}

export function buildIncome(entries: IncomeLike[]): IncomeSummary {
  const s: IncomeSummary = { turnover: 0, employment: 0, otherSection: 0, recoupment: 0, otherSectionBySource: {} };
  for (const i of entries) {
    const kind = classifyIncome(i);
    // VAT charged on income isn't income: use the amount without VAT.
    const amt = incomeExVat(i);
    s[kind] += amt;
    if (kind === "otherSection") {
      const src = i.source || "Other";
      s.otherSectionBySource[src] = (s.otherSectionBySource[src] ?? 0) + amt;
    }
  }
  return s;
}

export interface BusinessResult {
  turnoverRands: number;
  grossProfitRands: number;
  expenditureRands: number;
  /** Positive = Accounting Profit, negative = Accounting Loss. */
  accountingRands: number;
  recoupmentRands: number;
  /** Positive = Taxable Profit, negative = Taxable Loss. */
  taxableRands: number;
}

/** The ITR12 business section worked down the page, in whole rands. */
export function businessResult(income: IncomeSummary, expenditure: ExpenditureSummary): BusinessResult {
  const turnoverRands = toRands(income.turnover);
  // No Cost of Sales in the app, so Gross Profit is the turnover.
  const grossProfitRands = turnoverRands;
  const accountingRands = grossProfitRands - expenditure.totalRands;
  // A vehicle sale recoupment isn't in turnover, so it is added back.
  const recoupmentRands = toRands(income.recoupment);
  return {
    turnoverRands,
    grossProfitRands,
    expenditureRands: expenditure.totalRands,
    accountingRands,
    recoupmentRands,
    taxableRands: accountingRands + recoupmentRands,
  };
}

// ─── Year of assessment ──────────────────────────────────────────────────────

/** "2026/27" → "2027": SARS names the year after the year it ends in. */
export function yearOfAssessment(taxYear: string): string {
  return String(parseInt(taxYear.split("/")[0], 10) + 1);
}

/** "2026/27" → "1 March 2026 – 28 February 2027" (29 in a leap year). */
export function assessmentPeriod(taxYear: string): string {
  const start = parseInt(taxYear.split("/")[0], 10);
  const febDays = new Date(start + 1, 2, 0).getDate();
  return `1 March ${start} – ${febDays} February ${start + 1}`;
}

// ─── Privacy ─────────────────────────────────────────────────────────────────

/**
 * Bank statement descriptions often carry the full card number
 * ("ANTHROPIC 5179...6847", sometimes glued to the name). Keep the last four.
 * Phone numbers (10–11 digits) are left alone.
 */
export function maskCardNumbers(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/(?<!\d)(?:\d{4}[ -]){3}\d{4,7}(?!\d)/g, (m) => `****${m.replace(/\D/g, "").slice(-4)}`)
    .replace(/(?<!\d)\d{8,15}(\d{4})(?!\d)/g, (_m, last4) => `****${last4}`);
}

// ─── Checks before filing ────────────────────────────────────────────────────

export type FilingCheck =
  | { kind: "duplicate"; vendor: string; date: string; amount: number; count: number }
  | { kind: "largeEquipment"; vendor: string; date: string; amount: number }
  | { kind: "supermarketEntertainment"; vendor: string; date: string; amount: number }
  | { kind: "bondInterest"; vendor: string; date: string; amount: number }
  | { kind: "typeNotChosen"; vendor: string; date: string; amount: number; category: string; field: SarsExpenditureField };

const SUPERMARKET = /checkers|\bspar\b|kwikspar|superspar|pick ?n ?pay|woolworths|shoprite|food lover|makro|\bgame\b|usave/i;

const vendorKey = (v: string | null | undefined) =>
  maskCardNumbers(v).toLowerCase().replace(/\*+\d{4}/g, "").replace(/[^a-z]/g, "");

export function filingChecks(expenses: ExpenseLike[]): FilingCheck[] {
  const checks: FilingCheck[] = [];
  const deductible = expenses.filter((e) => e.is_deductible);

  const groups = new Map<string, ExpenseLike[]>();
  for (const e of deductible) {
    if (e.wear_and_tear_vehicle_id) continue;
    const key = `${e.expense_date}|${Number(e.amount).toFixed(2)}|${vendorKey(e.vendor)}`;
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  for (const g of groups.values()) {
    if (g.length > 1) {
      checks.push({ kind: "duplicate", vendor: maskCardNumbers(g[0].vendor), date: g[0].expense_date ?? "", amount: Number(g[0].amount), count: g.length });
    }
  }

  for (const e of deductible) {
    const cat = canonicalCategory(e.category);
    const base = { vendor: maskCardNumbers(e.vendor), date: e.expense_date ?? "", amount: Number(e.amount) };
    if (cat === "Equipment & Tools" && !e.wear_and_tear_vehicle_id && Number(e.gross_amount ?? e.amount) >= SMALL_ITEM_LIMIT) {
      checks.push({ kind: "largeEquipment", ...base });
    } else if (cat === "Meals & Entertainment" && SUPERMARKET.test(e.vendor ?? "")) {
      checks.push({ kind: "supermarketEntertainment", ...base });
    } else if (cat === "Interest & Finance Charges" && e.business_use_pct != null) {
      // Only the old "Bond" interest option saved a floor-ratio share here.
      checks.push({ kind: "bondInterest", ...base });
    } else if (SARS_FIELD_TYPES[cat] && !validSarsField(cat, e.sars_field)) {
      // Saved before the type picker existed: it sits in the default field.
      checks.push({ kind: "typeNotChosen", ...base, category: cat, field: SARS_FIELD_TYPES[cat][0].field as SarsExpenditureField });
    }
  }
  return checks;
}

// ─── 2025/26 income VAT check ────────────────────────────────────────────────
// Income was saved without VAT before 1.2.29, so a VAT vendor's local payments
// for 2025/26 may still include VAT. These are the entries worth checking:
// business income (turnover) with no VAT marked. Employment, rental, interest
// and the vehicle-sale row never carry VAT here.
export function incomeToCheckForVat<T extends IncomeLike>(entries: T[]): T[] {
  return entries.filter((i) => classifyIncome(i) === "turnover" && incomeVat(i) === 0);
}

/** Set once the user says they've checked their 2025/26 income. */
export const incomeVatCheckDoneKey = (userId: string) =>
  `@myexpense:income_vat_check_done_2025_26:${userId}`;
/** Set once the Home popup about the check has been seen. */
export const incomeVatCheckPopupKey = (userId: string) =>
  `@myexpense:seen_income_vat_check_popup_2025_26:${userId}`;
