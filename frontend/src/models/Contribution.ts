export interface Contribution {
  id: number;
  savings_account_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}
