import { create } from 'zustand';
import type { Expense, NewExpense, UpdateExpense } from '@/types/database';
import { expenseService } from '@/services/expenseService';
import { ACTIVE_TAX_YEAR } from '@/types/database';

// ─── Expense Store ────────────────────────────────────────────────────────────
// Global expense state. Import and use in any screen with:
//   const { expenses, totals, loadExpenses, addExpense } = useExpenseStore();
// ─────────────────────────────────────────────────────────────────────────────

interface ExpenseTotals {
  totalExpenses: number;
  totalDeductions: number;
  receiptCount: number;
}

interface ExpenseState {
  expenses: Expense[];
  recentExpenses: Expense[];
  totals: ExpenseTotals;
  activeTaxYear: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadExpenses: (userId: string, taxYear?: string) => Promise<void>;
  loadRecentExpenses: (userId: string) => Promise<void>;
  addExpense: (userId: string, expense: NewExpense) => Promise<Expense>;
  updateExpense: (expense: UpdateExpense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  setActiveTaxYear: (year: string) => void;
  clearError: () => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  recentExpenses: [],
  totals: { totalExpenses: 0, totalDeductions: 0, receiptCount: 0 },
  activeTaxYear: ACTIVE_TAX_YEAR,
  isLoading: false,
  error: null,

  // ── Load all expenses for a tax year ──────────────────────────────────────
  loadExpenses: async (userId, taxYear) => {
    const year = taxYear ?? get().activeTaxYear;
    set({ isLoading: true, error: null });
    try {
      const [expenses, totals] = await Promise.all([
        expenseService.getExpenses(userId, year),
        expenseService.getTotals(userId, year),
      ]);
      set({ expenses, totals });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Load recent expenses for Home screen ──────────────────────────────────
  loadRecentExpenses: async (userId) => {
    try {
      const recentExpenses = await expenseService.getRecentExpenses(userId, 10);
      set({ recentExpenses });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // ── Add expense (optimistic update) ──────────────────────────────────────
  addExpense: async (userId, expense) => {
    set({ isLoading: true, error: null });
    try {
      const newExpense = await expenseService.addExpense(userId, expense);
      set((state) => ({
        expenses: [newExpense, ...state.expenses],
        recentExpenses: [newExpense, ...state.recentExpenses].slice(0, 10),
        totals: {
          ...state.totals,
          totalExpenses: state.totals.totalExpenses + newExpense.amount,
          totalDeductions: newExpense.is_deductible
            ? state.totals.totalDeductions + newExpense.amount
            : state.totals.totalDeductions,
          receiptCount: state.totals.receiptCount + 1,
        },
      }));
      return newExpense;
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Update expense ────────────────────────────────────────────────────────
  updateExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await expenseService.updateExpense(expense);
      set((state) => ({
        expenses: state.expenses.map((e) => e.id === updated.id ? updated : e),
        recentExpenses: state.recentExpenses.map((e) => e.id === updated.id ? updated : e),
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Delete expense ────────────────────────────────────────────────────────
  deleteExpense: async (id) => {
    const expense = get().expenses.find((e) => e.id === id);
    set({ isLoading: true, error: null });
    try {
      await expenseService.deleteExpense(id);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        recentExpenses: state.recentExpenses.filter((e) => e.id !== id),
        totals: expense ? {
          ...state.totals,
          totalExpenses: state.totals.totalExpenses - expense.amount,
          totalDeductions: expense.is_deductible
            ? state.totals.totalDeductions - expense.amount
            : state.totals.totalDeductions,
          receiptCount: Math.max(0, state.totals.receiptCount - 1),
        } : state.totals,
      }));
    } catch (e: any) {
      set({ error: e.message });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveTaxYear: (year) => set({ activeTaxYear: year }),
  clearError: () => set({ error: null }),
}));
