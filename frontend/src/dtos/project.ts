export interface ProjectCreate {
  name: string;
  description?: string | null;
  target_amount: number;
  target_date: string;
  priority: string;
  category?: string | null;
  status?: string;
  savings_account_name: string;
  currency?: string;
}

export interface ProjectUpdate {
  name?: string | null;
  description?: string | null;
  target_amount?: number | null;
  target_date?: string | null;
  priority?: string | null;
  category?: string | null;
  status?: string | null;
  savings_account_name?: string | null;
  currency?: string | null;
}

