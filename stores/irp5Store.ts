import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEY = "@myexpense:irp5_v1";

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export interface IRP5Entry {
  id: string;
  employerName: string;
  certificateRef: string;
  taxYear: string;
  grossIncome: number;       // source code 3601
  payeDeducted: number;      // source code 4102
  uifDeducted: number;       // source code 4141
  pensionContributions: number; // source code 4001/4003
  incomeRecordId: string | null; // linked row in income table
}

interface IRP5Store {
  entries: IRP5Entry[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (entry: Omit<IRP5Entry, "id">) => Promise<IRP5Entry>;
  update: (id: string, updates: Partial<Omit<IRP5Entry, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

async function persist(entries: IRP5Entry[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export function irp5TotalPAYE(entries: IRP5Entry[], taxYear?: string): number {
  const filtered = taxYear ? entries.filter((e) => e.taxYear === taxYear) : entries;
  return filtered.reduce((s, e) => s + e.payeDeducted, 0);
}

export function irp5TotalGross(entries: IRP5Entry[], taxYear?: string): number {
  const filtered = taxYear ? entries.filter((e) => e.taxYear === taxYear) : entries;
  return filtered.reduce((s, e) => s + e.grossIncome, 0);
}

export const useIRP5Store = create<IRP5Store>((set, get) => ({
  entries: [],
  isLoaded: false,

  load: async () => {
    if (get().isLoaded) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      set({ entries: raw ? JSON.parse(raw) : [], isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  add: async (entry) => {
    const newEntry: IRP5Entry = { ...entry, id: genId() };
    const next = [...get().entries, newEntry];
    await persist(next);
    set({ entries: next });
    return newEntry;
  },

  update: async (id, updates) => {
    const next = get().entries.map((e) => (e.id === id ? { ...e, ...updates } : e));
    await persist(next);
    set({ entries: next });
  },

  remove: async (id) => {
    const next = get().entries.filter((e) => e.id !== id);
    await persist(next);
    set({ entries: next });
  },
}));
