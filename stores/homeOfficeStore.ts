import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "@myexpense:home_office_v1";

export type ArrangementType = "owned" | "renting" | "none";

export interface HomeOfficeSetting {
  officeM2: number;
  totalM2: number;
  arrangementType: ArrangementType;
  annualCost: number;
}

interface HomeOfficeStore {
  setting: HomeOfficeSetting | null;
  isLoaded: boolean;
  load: () => Promise<void>;
  save: (s: HomeOfficeSetting) => Promise<void>;
  clear: () => Promise<void>;
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

  load: async () => {
    if (get().isLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ setting: raw ? JSON.parse(raw) : null, isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  save: async (s) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
    set({ setting: s });
  },

  clear: async () => {
    await AsyncStorage.removeItem(KEY);
    set({ setting: null });
  },
}));
