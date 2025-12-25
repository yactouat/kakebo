export type ExpenseCategory = 
  | 'essential'
  | 'comfort'
  | 'entertainment and leisure'
  | 'extras'
  | 'unforeseen';

export interface ActualExpenseEntry {
  id: number;
  amount: number;
  date: string;
  item: string;
  category: ExpenseCategory;
  currency?: string;
}

