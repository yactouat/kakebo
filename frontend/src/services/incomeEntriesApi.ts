import type { IncomeEntry } from '../models/IncomeEntry';
import type { IncomeEntryCreate, IncomeEntryUpdate } from '../dtos/incomeEntry';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/income-entries`;

export const incomeEntriesApi = {
  async getAll(month: string): Promise<IncomeEntry[]> {
    const response = await fetch(`${API_BASE_URL}?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch income entries: ${response.statusText}`);
    }
    const result: APIResponse<IncomeEntry[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<IncomeEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Income entry with id ${id} not found`);
      }
      throw new Error(`Failed to fetch income entry: ${response.statusText}`);
    }
    const result: APIResponse<IncomeEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async create(entry: IncomeEntryCreate): Promise<IncomeEntry> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create income entry: ${response.statusText}`);
    }
    const result: APIResponse<IncomeEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async update(id: number, entry: IncomeEntryUpdate): Promise<IncomeEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Income entry with id ${id} not found`);
      }
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update income entry: ${response.statusText}`);
    }
    const result: APIResponse<IncomeEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async bulkDelete(entryIds: number[]): Promise<{ deleted_count: number }> {
    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry_ids: entryIds }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to delete income entries: ${response.statusText}`);
    }
    const result: APIResponse<{ deleted_count: number }> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async bulkUpdate(entryIds: number[], update: IncomeEntryUpdate): Promise<{ updated_count: number }> {
    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry_ids: entryIds, update }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update income entries: ${response.statusText}`);
    }
    const result: APIResponse<{ updated_count: number }> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Income entry with id ${id} not found`);
      }
      throw new Error(`Failed to delete income entry: ${response.statusText}`);
    }
  },
};

