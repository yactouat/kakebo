import type { FixedExpenseEntry } from '../models/FixedExpenseEntry';
import type { FixedExpenseEntryCreate, FixedExpenseEntryUpdate } from '../dtos/fixedExpenseEntry';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/fixed-expense-entries`;

export const fixedExpenseEntriesApi = {
  async copyToNextMonth(): Promise<{ copied_count: number }> {
    const response = await fetch(`${API_BASE_URL}/copy-to-next-month`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to copy fixed expense entries: ${response.statusText}`);
    }
    const result: APIResponse<{ copied_count: number }> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async copySelectedToNextMonth(entryIds: number[]): Promise<{ copied_count: number }> {
    const response = await fetch(`${API_BASE_URL}/copy-selected-to-next-month`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry_ids: entryIds }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to copy fixed expense entries: ${response.statusText}`);
    }
    const result: APIResponse<{ copied_count: number }> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async create(entry: FixedExpenseEntryCreate): Promise<FixedExpenseEntry> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create fixed expense entry: ${response.statusText}`);
    }
    const result: APIResponse<FixedExpenseEntry> = await response.json();
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
        throw new Error(`Fixed expense entry with id ${id} not found`);
      }
      throw new Error(`Failed to delete fixed expense entry: ${response.statusText}`);
    }
  },

  async getAll(month: string): Promise<FixedExpenseEntry[]> {
    const response = await fetch(`${API_BASE_URL}?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch fixed expense entries: ${response.statusText}`);
    }
    const result: APIResponse<FixedExpenseEntry[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<FixedExpenseEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Fixed expense entry with id ${id} not found`);
      }
      throw new Error(`Failed to fetch fixed expense entry: ${response.statusText}`);
    }
    const result: APIResponse<FixedExpenseEntry> = await response.json();
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
      throw new Error(errorData.detail || `Failed to delete fixed expense entries: ${response.statusText}`);
    }
    const result: APIResponse<{ deleted_count: number }> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async bulkUpdate(entryIds: number[], update: FixedExpenseEntryUpdate): Promise<{ updated_count: number }> {
    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry_ids: entryIds, update }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update fixed expense entries: ${response.statusText}`);
    }
    const result: APIResponse<{ updated_count: number }> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async update(id: number, entry: FixedExpenseEntryUpdate): Promise<FixedExpenseEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Fixed expense entry with id ${id} not found`);
      }
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update fixed expense entry: ${response.statusText}`);
    }
    const result: APIResponse<FixedExpenseEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async merge(entryIds: number[]): Promise<FixedExpenseEntry> {
    if (entryIds.length < 2) {
      throw new Error('At least 2 entries are required to merge');
    }

    const response = await fetch(`${API_BASE_URL}/merge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry_ids: entryIds }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to merge fixed expense entries: ${response.statusText}`);
    }
    const result: APIResponse<FixedExpenseEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },
};

