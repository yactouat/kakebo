export interface ContributionCreate {
  project_id: number;
  amount: number;
  date: string;
  notes?: string | null;
}

