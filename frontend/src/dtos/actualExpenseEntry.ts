import type { ExpenseCategory } from '../models/ActualExpenseEntry';

export interface ActualExpenseEntryCreate {
  amount: number;
  date: string;
  item: string;
  category: ExpenseCategory;
  currency?: string;
}

export interface ActualExpenseEntryUpdate {
  amount?: number;
  date?: string;
  item?: string;
  category?: ExpenseCategory;
  currency?: string;
}

