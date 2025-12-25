import type { APIResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000/available-cash/by-month';

export interface AvailableCashData {
  available_cash: number;
  total_income: number;
  total_expenses: number;
  month: string;
}

export const availableCashApi = {
  async get(month: string): Promise<AvailableCashData> {
    const response = await fetch(`${API_BASE_URL}?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch available cash: ${response.statusText}`);
    }
    const result: APIResponse<AvailableCashData> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },
};

