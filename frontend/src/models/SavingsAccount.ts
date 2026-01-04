export interface SavingsAccount {
  id: number;
  name: string;
  initial_balance: number;
  currency: string;
  bank_institution?: string | null;
  created_at: string;
  updated_at?: string | null;
}
