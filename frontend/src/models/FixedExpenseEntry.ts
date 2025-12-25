export interface FixedExpenseEntry {
  id: number;
  amount: number;
  item: string;
  currency?: string;
  month: number;
  year: number;
}

