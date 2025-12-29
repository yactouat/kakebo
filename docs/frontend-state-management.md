# Frontend State Management

This document explains how state management works in the Kakebo frontend application, including when to use global state vs. component-local state, and how to coordinate data updates across components.

## Overview

The application uses a **hybrid state management approach**:

- **Zustand** for global, shared state that needs to persist across navigation or be accessed by multiple components
- **React `useState`** for component-local state and data fetching
- **Data change notification pattern** for coordinating updates across components after mutations

## Zustand Store (`useAppStore`)

The global store is located at `/frontend/src/stores/useAppStore.ts` and uses Zustand with localStorage persistence.

### What Belongs in the Store

The store should only contain:

1. **Shared UI state** that needs to persist across navigation
   - Example: `activeTab` - persists the selected tab (income/fixed expenses/actual expenses) when navigating between pages

2. **State that multiple components depend on simultaneously**
   - Example: `selectedMonth` and `selectedYear` - used by tables, charts, and summary components to filter data for the same month

3. **Global coordination mechanisms**
   - Example: `dataChangeCounter` and `notifyDataChange()` - used to trigger re-renders across components after data mutations

### Current Store State

```typescript
interface AppState {
  activeTab: string;                    // Persisted tab selection
  dataChangeCounter: number;            // Incremented to trigger re-renders
  notifyDataChange: () => void;        // Function to increment counter
  selectedMonth: number | null;        // Shared month filter
  selectedYear: number | null;          // Shared year filter
  setActiveTab: (tab: string) => void;
  setSelectedMonth: (month: number | null) => void;
  setSelectedYear: (year: number | null) => void;
}
```

### Persistence

The store is persisted to `localStorage` under the key `kakebo-storage`, which means:
- Tab selection persists across browser sessions
- Month/year selection persists across browser sessions
- The `dataChangeCounter` is reset on page load (not persisted)

## Component-Local State

Most data in the application is managed locally within components using React's `useState` hook. This includes:

- **Entry data** (income, expenses) - fetched and managed per component
- **Calculated data** (net worth, available cash) - computed and cached locally
- **UI state** (modals, loading states) - component-specific
- **Feature-specific data** (projects, contributions) - when only used in one component or page

### Example: Component-Local Data Fetching

```typescript
// NetWorthPage.tsx
const NetWorthPage = () => {
  const { dataChangeCounter } = useAppStore(); // Listen to global changes
  const [netWorthData, setNetWorthData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchNetWorth = async () => {
      setLoading(true);
      const data = await netWorthService.getNetWorth(monthString);
      setNetWorthData(data);
      setLoading(false);
    };
    fetchNetWorth();
  }, [dataChangeCounter]); // Re-fetch when data changes globally
};
```

## Data Change Notification Pattern

This pattern coordinates updates across components after mutations (create/update/delete operations).

### How It Works

1. **After mutations**, call `notifyDataChange()` to increment the global counter
2. **Components that depend on the data** listen to `dataChangeCounter` in their `useEffect` dependencies
3. **When the counter changes**, dependent components automatically re-fetch their data

### Pattern Implementation

**Step 1: Call `notifyDataChange()` after mutations**

```typescript
// In useEntryTable.ts or any component with mutations
const handleCreate = async (values: TCreate) => {
  await api.create(entryData);
  await fetchEntries(); // Refresh local data
  notifyDataChange();   // Notify other components
};
```

**Step 2: Listen to `dataChangeCounter` in dependent components**

```typescript
// In components that need to react to changes
const { dataChangeCounter } = useAppStore();

useEffect(() => {
  fetchData(); // Re-fetch when counter changes
}, [dataChangeCounter]);
```

### Real-World Examples

**Example 1: Entry Table Mutations**

The `useEntryTable` hook (used by `IncomeTable`, `FixedExpenseTable`, `ActualExpenseTable`) calls `notifyDataChange()` after all mutations:

```typescript
// useEntryTable.ts
const handleCreate = async (values: TCreate) => {
  await api.create(entryData);
  await fetchEntries();
  notifyDataChange(); // Triggers re-renders in AvailableCash, SummaryTable, etc.
};
```

**Example 2: Dependent Component**

`NetWorthPage` listens to `dataChangeCounter` to recalculate net worth when any entry changes:

```typescript
// NetWorthPage.tsx
useEffect(() => {
  fetchNetWorth();
}, [dataChangeCounter]); // Re-calculates when any entry is created/updated/deleted
```

**Example 3: Multiple Dependent Components**

When an expense entry is created:
1. `ActualExpenseTable` updates its local state
2. `notifyDataChange()` is called
3. `AvailableCash` component re-fetches and recalculates
4. `SummaryTable` re-fetches and updates totals
5. `DonutChart` re-fetches and updates category breakdown
6. `SpendingVelocityChart` re-fetches and updates daily spending

All of this happens automatically because they all listen to `dataChangeCounter`.

## Best Practices

### ✅ Do

- **Use global store for shared filters**: `selectedMonth`/`selectedYear` are used by many components
- **Use global store for persisted UI state**: `activeTab` persists across navigation
- **Call `notifyDataChange()` after mutations**: Ensures dependent components stay in sync
- **Use component-local state for data**: Fetch and manage data locally, listen to `dataChangeCounter` for updates
- **Use component-local state for UI**: Modals, loading states, form state should be local

### ❌ Don't

- **Don't put component-local data in the store**: Projects, contributions, and entry lists should be component-local
- **Don't put calculated values in the store**: Net worth, available cash should be computed locally
- **Don't forget to call `notifyDataChange()`**: Missing this will cause stale data in dependent components
- **Don't put temporary UI state in the store**: Loading states, modal open/close should be local

## When to Add New State to the Store

Ask yourself:

1. **Is this state used by multiple components simultaneously?**
   - ✅ Yes → Consider global store
   - ❌ No → Use component-local state

2. **Does this state need to persist across navigation?**
   - ✅ Yes → Consider global store
   - ❌ No → Use component-local state

3. **Is this state shared across different pages?**
   - ✅ Yes → Consider global store
   - ❌ No → Use component-local state

If the answer is "No" to all questions, use component-local state.

## Future Considerations

### Projects and Contributions

Currently, projects and contributions are not used in any UI components. When implementing these features:

- **Keep them component-local**: Use `useState` or React Query for fetching and managing project/contribution data
- **Call `notifyDataChange()` after mutations**: If projects/contributions affect other calculations (e.g., net worth), ensure dependent components listen to `dataChangeCounter`
- **Don't add to global store**: Unless they need to be shared across multiple components simultaneously

### React Query (Future Consideration)

For complex data fetching scenarios, consider migrating to React Query (TanStack Query) which provides:
- Automatic caching
- Background refetching
- Optimistic updates
- Better loading/error states

However, the current `useState` + `dataChangeCounter` pattern works well for this application's needs.

## Summary

- **Global store (Zustand)**: Shared filters, persisted UI state, coordination mechanism
- **Component-local state (useState)**: Data fetching, calculated values, UI state
- **Data change pattern**: Call `notifyDataChange()` after mutations, listen to `dataChangeCounter` for updates
- **Keep it simple**: Only use global state when truly needed across multiple components

This hybrid approach provides a good balance between simplicity and coordination, avoiding over-engineering while ensuring components stay in sync.

