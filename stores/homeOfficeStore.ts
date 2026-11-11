import { create } from "zustand";
import {
  homeOfficeService,
  type ArrangementType,
  type HomeOfficeSetting,
} from "@/services/homeOfficeService";

export type { ArrangementType, HomeOfficeSetting };
// The rules live in lib/homeOffice.ts (unit tested). Re-exported so existing
// imports from the store keep working.
export { annualDeductible, floorRatio } from "@/lib/homeOffice";

interface HomeOfficeStore {
  setting: HomeOfficeSetting | null;
  isLoaded: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, s: HomeOfficeSetting) => Promise<void>;
  clear: (userId: string) => Promise<void>;
}

export const useHomeOfficeStore = create<HomeOfficeStore>((set, get) => ({
  setting: null,
  isLoaded: false,

  load: async (userId) => {
    if (get().isLoaded) return;
    try {
      const setting = await homeOfficeService.getSetting(userId);
      set({ setting, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  save: async (userId, s) => {
    await homeOfficeService.saveSetting(userId, s);
    set({ setting: s, isLoaded: true });
  },

  clear: async (userId) => {
    await homeOfficeService.deleteSetting(userId);
    set({ setting: null, isLoaded: true });
  },
}));
