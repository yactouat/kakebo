export interface Debt {
  id: number;
  name: string;
  initial_amount: number;
  current_balance: number;
  currency?: string;
  linked_fixed_expense_id?: number | null;
  notes?: string | null;
  created_at: string;
}

