// ─── Canonical Category List ──────────────────────────────────────────────────
// Single source of truth for all expense categories across add-expense-manual,
// receipt-review, category-breakdown, and expenseService.
// Import from here — never define category names inline in screens.
// ─────────────────────────────────────────────────────────────────────────────

export interface Category {
  label: string;
  icon: string;
  code: string;
  deductible: boolean;
  partialCap?: number;
  /** One-line keyword hint shown in category pickers and fed into the OCR
   * prompt to disambiguate lookalike categories (e.g. connectivity bills vs
   * SaaS subscriptions). Keep short — this is a hint, not a description. */
  examples: string;
}

export const CATEGORIES: Category[] = [
  { label: "Travel & Transport",       icon: "car.fill",              code: "S8(1)(b)",  deductible: true,  examples: "Flights, Uber/Bolt, parking, tolls, car hire" },
  { label: "Home Office",              icon: "house.fill",            code: "S11(a)/S23(b)", deductible: true, examples: "Proportional rent or bond interest for a dedicated home workspace" },
  { label: "Equipment & Tools",        icon: "wrench.fill",           code: "S11(e)",    deductible: true,  examples: "Laptop, monitor, printer, tools, hardware" },
  { label: "Software & Subscriptions", icon: "gearshape.fill",        code: "S11(a)",    deductible: true,  examples: "Apps & SaaS — Netflix, Adobe, Microsoft 365, Canva, hosting, domains (not phone/internet bills)" },
  { label: "Meals & Entertainment",    icon: "fork.knife",            code: "S23(o)",    deductible: true, partialCap: 0.8, examples: "Client lunches, coffee meetings, work dinners" },
  { label: "Professional Fees",        icon: "doc.text.fill",         code: "S11(a)",    deductible: true,  examples: "Accountant, bookkeeper, lawyer, consultant invoices" },
  { label: "Utilities",                icon: "bolt.fill",             code: "S11(a)",    deductible: true,  examples: "Electricity, water, rates and taxes (not phone/internet)" },
  { label: "Marketing & Advertising",  icon: "megaphone.fill",        code: "S11(a)",    deductible: true,  examples: "Social media ads, flyers, business cards, website design" },
  { label: "Bank Charges",             icon: "building.columns.fill", code: "S11(a)",    deductible: true,  examples: "Monthly account fees, transaction fees, card fees" },
  { label: "Interest & Finance Charges", icon: "percent",             code: "S11(a)",    deductible: true,  examples: "Loan interest, overdraft interest, finance charges (not bank fees)" },
  { label: "Insurance",                icon: "shield.fill",           code: "S11(a)",    deductible: true,  examples: "Business, professional indemnity, asset insurance" },
  { label: "Rent",                     icon: "building.2.fill",       code: "S11(a)",    deductible: true,  examples: "Office or workspace rental (not home office)" },
  { label: "Repairs & Maintenance",    icon: "wrench.fill",           code: "S11(a)",    deductible: true,  examples: "Fixing equipment, office repairs, servicing" },
  { label: "Training & Education",     icon: "book.fill",             code: "S11(a)",    deductible: true,  examples: "Courses, workshops, conferences, certifications" },
  { label: "Telephone & Internet",     icon: "phone.fill",            code: "S11(a)",    deductible: true,  examples: "Airtime, data, fibre, ADSL, WiFi, ISP bills (Vodacom, MTN, Telkom, Cell C, RSAWeb)" },
  { label: "Vehicle Expenses",         icon: "car.fill",              code: "S11(a)",    deductible: true,  examples: "Fuel, vehicle maintenance, licensing (non-mileage vehicle costs)" },
  { label: "Retirement Annuity",       icon: "chart.bar.fill",        code: "S11F",      deductible: true,  examples: "Retirement annuity contributions" },
  { label: "Personal / Other",         icon: "person.fill",           code: "N/A",       deductible: false, examples: "Non-business or personal expenses (not tax-deductible)" },
];

// Keyed lookup for service-layer caps (fraction of amount that is deductible).
// S23(o): only 80% of meals & entertainment is deductible.
export const CATEGORY_PARTIAL_CAPS: Record<string, number> = Object.fromEntries(
  CATEGORIES.filter((c) => c.partialCap !== undefined).map((c) => [c.label, c.partialCap!]),
);

export const NON_DEDUCTIBLE_LABEL = "Personal / Other";
