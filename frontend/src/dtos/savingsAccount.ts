export interface SavingsAccountCreate {
  name: string;
  initial_balance: number;
  currency: string;
  bank_institution?: string | null;
}

export interface SavingsAccountUpdate {
  name?: string;
  initial_balance?: number;
  currency?: string;
  bank_institution?: string | null;
}
