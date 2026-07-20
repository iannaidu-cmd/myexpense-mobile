import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Expense, NewExpense, UpdateExpense } from '@/types/database';
import { expenseService } from '@/services/expenseService';
import { ACTIVE_TAX_YEAR } from '@/types/database';
import { mmkvStorage } from '@/lib/storage';

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

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      recentExpenses: [],
      totals: { totalExpenses: 0, totalDeductions: 0, receiptCount: 0 },
      activeTaxYear: ACTIVE_TAX_YEAR,
      isLoading: false,
      error: null,

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

      loadRecentExpenses: async (userId) => {
        try {
          const recentExpenses = await expenseService.getRecentExpenses(userId, 10);
          set({ recentExpenses });
        } catch (e: any) {
          set({ error: e.message });
        }
      },

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
    }),
    {
      name: 'expense-store',
      storage: mmkvStorage,
      // activeTaxYear is deliberately NOT persisted: it must always start
      // from the freshly-computed current tax year on cold start, not a
      // value frozen from whenever the store was first created. Otherwise a
      // persisted store silently keeps showing last year's data after the
      // 1 March SA tax-year rollover.
      partialize: (state) => ({
        expenses: state.expenses,
        recentExpenses: state.recentExpenses,
        totals: state.totals,
      }),
    }
  )
);
