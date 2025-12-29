export interface Project {
  id: number;
  name: string;
  description?: string | null;
  target_amount: number;
  target_date: string;
  priority: string;
  category?: string | null;
  status: string;
  savings_account_name: string;
  currency: string;
  created_at: string;
  updated_at: string;
  current_savings: number;
  progress_percentage: number;
}

