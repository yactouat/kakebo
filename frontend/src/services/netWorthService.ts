import type { Debt } from '../models/Debt';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

export interface NetWorthData {
  available_cash: number;
  total_debts: number;
  net_worth: number;
  debts: Debt[];
  month: string;
}

const API_BASE_URL = `${getApiBaseUrl()}/net-worth`;

export const netWorthService = {
  async getNetWorth(month: string): Promise<NetWorthData> {
    const response = await fetch(`${API_BASE_URL}?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch net worth: ${response.statusText}`);
    }
    const result: APIResponse<NetWorthData> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },
};

