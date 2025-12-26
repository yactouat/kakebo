import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  activeTab: string;
  dataChangeCounter: number;
  notifyDataChange: () => void;
  selectedMonth: number | null;
  selectedYear: number | null;
  setActiveTab: (tab: string) => void;
  setSelectedMonth: (month: number | null) => void;
  setSelectedYear: (year: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'income',
      dataChangeCounter: 0,
      notifyDataChange: () => set((state) => ({ dataChangeCounter: state.dataChangeCounter + 1 })),
      selectedMonth: null,
      selectedYear: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      setSelectedYear: (year) => set({ selectedYear: year }),
    }),
    {
      name: 'kakebo-storage', // unique name for localStorage key
    }
  )
);

