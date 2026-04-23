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
}

export const CATEGORIES: Category[] = [
  { label: "Travel & Transport",       icon: "car.fill",              code: "S11(a)",  deductible: true  },
  { label: "Home Office",              icon: "house.fill",            code: "S11(a)",  deductible: true  },
  { label: "Equipment & Tools",        icon: "wrench.fill",           code: "S11(e)",  deductible: true  },
  { label: "Software & Subscriptions", icon: "gearshape.fill",        code: "S11(a)",  deductible: true  },
  { label: "Meals & Entertainment",    icon: "fork.knife",            code: "S11(a)",  deductible: true, partialCap: 0.8 },
  { label: "Professional Fees",        icon: "doc.text.fill",         code: "S11(a)",  deductible: true  },
  { label: "Utilities",                icon: "bolt.fill",             code: "S11(a)",  deductible: true  },
  { label: "Marketing & Advertising",  icon: "megaphone.fill",        code: "S11(a)",  deductible: true  },
  { label: "Bank Charges",             icon: "building.columns.fill", code: "S11(a)",  deductible: true  },
  { label: "Insurance",                icon: "shield.fill",           code: "S11(a)",  deductible: true  },
  { label: "Rent",                     icon: "building.2.fill",       code: "S11(a)",  deductible: true  },
  { label: "Repairs & Maintenance",    icon: "wrench.fill",           code: "S11(a)",  deductible: true  },
  { label: "Training & Education",     icon: "book.fill",             code: "S11(a)",  deductible: true  },
  { label: "Telephone & Cell",         icon: "phone.fill",            code: "S11(a)",  deductible: true  },
  { label: "Vehicle Expenses",         icon: "car.fill",              code: "Page 24", deductible: true  },
  { label: "Retirement Annuity",       icon: "chart.bar.fill",        code: "S11F",    deductible: true  },
  { label: "Personal / Other",         icon: "person.fill",           code: "N/A",     deductible: false },
];

// Keyed lookup for service-layer caps (fraction of amount that is deductible).
// S23(o): only 80% of meals & entertainment is deductible.
export const CATEGORY_PARTIAL_CAPS: Record<string, number> = Object.fromEntries(
  CATEGORIES.filter((c) => c.partialCap !== undefined).map((c) => [c.label, c.partialCap!]),
);

export const NON_DEDUCTIBLE_LABEL = "Personal / Other";
