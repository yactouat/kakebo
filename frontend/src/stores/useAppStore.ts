import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedMonth: null,
      setSelectedMonth: (month) => set({ selectedMonth: month }),
      activeTab: 'income',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'kakebo-storage', // unique name for localStorage key
    }
  )
);

