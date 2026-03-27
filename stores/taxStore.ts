import { create } from 'zustand';
import type { TaxSummary } from '@/types/database';
import { taxService } from '@/services/taxService';
import { ACTIVE_TAX_YEAR } from '@/types/database';

// ─── Tax Store ────────────────────────────────────────────────────────────────
// Global tax summary state. Import and use in any screen with:
//   const { summary, loadSummary } = useTaxStore();
// ─────────────────────────────────────────────────────────────────────────────

interface TaxState {
  summary: TaxSummary | null;
  activeTaxYear: string;
  isLoading: boolean;
  error: string | null;

  loadSummary: (userId: string, taxYear?: string) => Promise<void>;
  recalculate: (userId: string, taxYear?: string) => Promise<void>;
  setActiveTaxYear: (year: string) => void;
  clearError: () => void;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  summary: null,
  activeTaxYear: ACTIVE_TAX_YEAR,
  isLoading: false,
  error: null,

  loadSummary: async (userId, taxYear) => {
    const year = taxYear ?? get().activeTaxYear;
    set({ isLoading: true, error: null });
    try {
      const summary = await taxService.getTaxSummary(userId, year);
      set({ summary });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  recalculate: async (userId, taxYear) => {
    const year = taxYear ?? get().activeTaxYear;
    set({ isLoading: true, error: null });
    try {
      const summary = await taxService.recalculateSummary(userId, year);
      set({ summary });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveTaxYear: (year) => set({ activeTaxYear: year }),
  clearError: () => set({ error: null }),
}));
