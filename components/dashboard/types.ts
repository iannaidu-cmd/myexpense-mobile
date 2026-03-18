export interface Category {
  id: string;
  name: string;
  icon: string;
  amount: number;
  color: string;
  pct: number;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
  deductible: boolean;
}

export interface DashboardData {
  user: string;
  month: string;
  taxSaved: number;
  totalExpenses: number;
  deductiblePct: number;
  budget: number;
  categories: Category[];
  recentExpenses: Expense[];
}
export interface Month {
  month: string;
  year: number;
  expenses: number;
  amount: number;
  saved: number;
  active?: boolean;
}

export interface TaxYear {
  label: string;
  active: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  icon: string;
  timestamp: string;
  priority: "high" | "normal" | "low";
  read: boolean;
}

export type DashboardScreen =
  | "overview"
  | "period"
  | "notifications"
  | "search";
