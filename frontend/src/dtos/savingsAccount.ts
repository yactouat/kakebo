export interface SavingsAccountCreate {
  name: string;
  /** Snapshot of your real-world account balance when you first add the account. Track future changes via contributions. */
  base_balance: number;
  currency: string;
  bank_institution?: string | null;
}

export interface SavingsAccountUpdate {
  name?: string;
  base_balance?: number;
  currency?: string;
  bank_institution?: string | null;
}
