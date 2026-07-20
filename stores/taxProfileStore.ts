import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "@myexpense:tax_profile_v1";

export interface TaxProfile {
  age: number;
  numMedDependants: number;   // dependants on medical aid (not counting self)
  hasDisability: boolean;     // self or dependant has qualifying disability
  medicalAidAnnualContrib: number; // total annual medical aid contributions paid
}

const DEFAULTS: TaxProfile = {
  age: 0,
  numMedDependants: 0,
  hasDisability: false,
  medicalAidAnnualContrib: 0,
};

// SARS 2025/26 medical tax credit (S6A)
// Main member: R364/month · First dependant: R364/month · Each additional: R246/month
export function medicalTaxCredit(numMedDependants: number): number {
  const MAIN      = 4_368; // R364 × 12
  const FIRST_DEP = 4_368;
  const ADD_DEP   = 2_952; // R246 × 12
  if (numMedDependants === 0) return MAIN;
  if (numMedDependants === 1) return MAIN + FIRST_DEP;
  return MAIN + FIRST_DEP + (numMedDependants - 1) * ADD_DEP;
}

interface TaxProfileStore {
  profile: TaxProfile;
  isLoaded: boolean;
  load: () => Promise<void>;
  save: (p: TaxProfile) => Promise<void>;
}

export const useTaxProfileStore = create<TaxProfileStore>((set, get) => ({
  profile: DEFAULTS,
  isLoaded: false,

  load: async () => {
    if (get().isLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({
        profile: raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS,
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  save: async (p) => {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
    set({ profile: p });
  },
}));
