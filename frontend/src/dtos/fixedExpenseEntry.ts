export interface FixedExpenseEntryCreate {
  amount: number;
  item: string;
  currency?: string;
}

export interface FixedExpenseEntryUpdate {
  amount?: number;
  item?: string;
  currency?: string;
}

