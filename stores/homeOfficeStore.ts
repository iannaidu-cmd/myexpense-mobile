import { create } from "zustand";
import {
  homeOfficeService,
  type ArrangementType,
  type HomeOfficeSetting,
} from "@/services/homeOfficeService";

export type { ArrangementType, HomeOfficeSetting };

interface HomeOfficeStore {
  setting: HomeOfficeSetting | null;
  isLoaded: boolean;
  load: (userId: string) => Promise<void>;
  save: (userId: string, s: HomeOfficeSetting) => Promise<void>;
  clear: (userId: string) => Promise<void>;
}

export function floorRatio(s: HomeOfficeSetting | null): number {
  if (!s || s.totalM2 <= 0) return 0;
  return Math.min(s.officeM2 / s.totalM2, 1);
}

export function annualDeductible(s: HomeOfficeSetting | null): number {
  if (!s || s.arrangementType === "none") return 0;
  return Math.round(s.annualCost * floorRatio(s));
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
    set({ setting: s });
  },

  clear: async (userId) => {
    await homeOfficeService.deleteSetting(userId);
    set({ setting: null });
  },
}));
