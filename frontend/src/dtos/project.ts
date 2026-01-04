import type { ProjectStatus } from '../models/Project';

export interface ProjectCreate {
  name: string;
  description?: string | null;
  target_amount: number;
  status: ProjectStatus;
  savings_account_id?: number | null;
  currency: string;
  priority_order: number;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  target_amount?: number;
  status?: ProjectStatus;
  savings_account_id?: number | null;
  currency?: string;
  priority_order?: number;
}
