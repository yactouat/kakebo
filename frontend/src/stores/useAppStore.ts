import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  activeTab: string;
  dataChangeCounter: number;
  notifyDataChange: () => void;
  selectedMonth: number | null;
  setActiveTab: (tab: string) => void;
  setSelectedMonth: (month: number | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'income',
      dataChangeCounter: 0,
      notifyDataChange: () => set((state) => ({ dataChangeCounter: state.dataChangeCounter + 1 })),
      selectedMonth: null,
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedMonth: (month) => set({ selectedMonth: month }),
    }),
    {
      name: 'kakebo-storage', // unique name for localStorage key
    }
  )
);

