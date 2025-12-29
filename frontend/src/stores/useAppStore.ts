import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global application state store.
 * 
 * **What belongs here:**
 * - Shared UI state that needs to persist across navigation (e.g., selectedMonth, activeTab)
 * - State that multiple components depend on simultaneously
 * 
 * **What doesn't belong here:**
 * - Component-local data (e.g., projects, contributions) - use useState or React Query
 * - Data that's only used in one component or page
 * 
 * **Data change notification pattern:**
 * - After any mutation (create/update/delete) that affects other components, call `notifyDataChange()`
 * - Components that need to react to data changes should listen to `dataChangeCounter` in useEffect dependencies
 * - Example: After creating/updating/deleting projects or contributions, call `notifyDataChange()` to trigger
 *   re-renders in dependent components (e.g., if net worth or other calculations depend on them)
 * 
 * **Current usage:**
 * - `selectedMonth`/`selectedYear`: Shared filter used by multiple components (IncomeTable, ExpenseTable, charts, etc.)
 * - `activeTab`: Persists the active tab selection across navigation
 * - `dataChangeCounter`/`notifyDataChange()`: Global notification system for triggering re-renders
 */
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

