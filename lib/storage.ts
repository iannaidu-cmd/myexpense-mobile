import { MMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

const mmkv = new MMKV({ id: 'myexpense-store' });

export const mmkvStorage = createJSONStorage(() => ({
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
}));
