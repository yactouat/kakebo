export type ProjectStatus = 'Active' | 'Paused' | 'Completed' | 'Cancelled';

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  target_amount: number;
  status: ProjectStatus;
  savings_account_id?: number | null;
  currency: string;
  priority_order: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ProjectProgress {
  project_id: number;
  target_amount: number;
  current_balance: number;
  progress_percentage: number;
  status: ProjectStatus;
}
