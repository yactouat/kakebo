export interface SavingsAccount {
  id: number;
  name: string;
  /** Snapshot of your real-world account balance when you first added the account. Current balance = base_balance + contributions. */
  base_balance: number;
  currency: string;
  bank_institution?: string | null;
  created_at: string;
  updated_at?: string | null;
}
