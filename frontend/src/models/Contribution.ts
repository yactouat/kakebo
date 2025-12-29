export interface Contribution {
  id: number;
  project_id: number;
  amount: number;
  date: string;
  notes?: string | null;
  created_at: string;
}

