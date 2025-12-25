export interface FixedExpenseEntryCreate {
  amount: number;
  item: string;
  currency?: string;
  month?: number;
  year?: number;
}

export interface FixedExpenseEntryUpdate {
  amount?: number;
  item?: string;
  currency?: string;
  month?: number;
  year?: number;
}

