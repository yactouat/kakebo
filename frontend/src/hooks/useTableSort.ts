import { useState, useEffect, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}

const STORAGE_PREFIX = 'kakebo_table_sort_';

export function useTableSort<T>(
  tableId: string,
  data: T[],
  getValue: (entry: T, column: string) => any
): {
  sortedData: T[];
  sortState: SortState;
  handleSort: (column: string) => void;
} {
  const storageKey = `${STORAGE_PREFIX}${tableId}`;

  // Load initial sort state from localStorage
  const getInitialSortState = (): SortState => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          column: parsed.column || null,
          direction: parsed.direction || null,
        };
      }
    } catch (error) {
      console.error('Failed to load sort state from localStorage:', error);
    }
    return { column: null, direction: null };
  };

  const [sortState, setSortState] = useState<SortState>(getInitialSortState);

  // Save sort state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(sortState));
    } catch (error) {
      console.error('Failed to save sort state to localStorage:', error);
    }
  }, [storageKey, sortState]);

  const handleSort = (column: string) => {
    setSortState((prev) => {
      if (prev.column === column) {
        // Cycle through: asc -> desc -> null
        if (prev.direction === 'asc') {
          return { column, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { column: null, direction: null };
        }
      }
      // New column, start with asc
      return { column, direction: 'asc' };
    });
  };

  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return [...data];
    }

    return [...data].sort((a, b) => {
      const aValue = getValue(a, sortState.column!);
      const bValue = getValue(b, sortState.column!);

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        // Fallback to string comparison
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState, getValue]);

  return {
    sortedData,
    sortState,
    handleSort,
  };
}

