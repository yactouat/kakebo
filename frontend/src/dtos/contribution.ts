export interface ContributionCreate {
  savings_account_id: number;
  amount: number;
  date: string;
  notes?: string | null;
}

export interface ContributionUpdate {
  savings_account_id?: number;
  amount?: number;
  date?: string;
  notes?: string | null;
}
