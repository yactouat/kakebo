import type { ActualExpenseEntry } from '../models/ActualExpenseEntry';
import type { ActualExpenseEntryCreate, ActualExpenseEntryUpdate } from '../dtos/actualExpenseEntry';
import type { APIResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000/actual-expense-entries';

export const actualExpenseEntriesApi = {
  async getAll(month: string): Promise<ActualExpenseEntry[]> {
    const response = await fetch(`${API_BASE_URL}?month=${encodeURIComponent(month)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch actual expense entries: ${response.statusText}`);
    }
    const result: APIResponse<ActualExpenseEntry[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<ActualExpenseEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Actual expense entry with id ${id} not found`);
      }
      throw new Error(`Failed to fetch actual expense entry: ${response.statusText}`);
    }
    const result: APIResponse<ActualExpenseEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async create(entry: ActualExpenseEntryCreate): Promise<ActualExpenseEntry> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create actual expense entry: ${response.statusText}`);
    }
    const result: APIResponse<ActualExpenseEntry> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async update(id: number, entry: ActualExpenseEntryUpdate): Promise<ActualExpenseEntry> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Actual expense entry with id ${id} not found`);
      }
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update actual expense entry: ${response.statusText}`);
    }
    const result: APIResponse<ActualExpenseEntry> = await response.json();
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
        throw new Error(`Actual expense entry with id ${id} not found`);
      }
      throw new Error(`Failed to delete actual expense entry: ${response.statusText}`);
    }
  },
};

