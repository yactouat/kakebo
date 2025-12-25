export interface IncomeEntryCreate {
  amount: number;
  date: string;
  item: string;
  currency?: string;
}

export interface IncomeEntryUpdate {
  amount?: number;
  date?: string;
  item?: string;
  currency?: string;
}

