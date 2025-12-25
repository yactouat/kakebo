import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonth: null,
      setSelectedMonth: (month) => set({ selectedMonth: month }),
    }),
    {
      name: 'kakebo-storage', // unique name for localStorage key
    }
  )
);

