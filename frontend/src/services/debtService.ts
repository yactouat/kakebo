import type { Debt } from '../models/Debt';
import type { DebtEntryCreate, DebtEntryUpdate } from '../dtos/debtEntry';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/debt-entries`;

export const debtService = {
  async create(entry: DebtEntryCreate): Promise<Debt> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create debt entry: ${response.statusText}`);
    }
    const result: APIResponse<Debt> = await response.json();
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
        throw new Error(`Debt entry with id ${id} not found`);
      }
      throw new Error(`Failed to delete debt entry: ${response.statusText}`);
    }
  },

  async getAll(): Promise<Debt[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch debt entries: ${response.statusText}`);
    }
    const result: APIResponse<Debt[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<Debt> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Debt entry with id ${id} not found`);
      }
      throw new Error(`Failed to fetch debt entry: ${response.statusText}`);
    }
    const result: APIResponse<Debt> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },

  async update(id: number, entry: DebtEntryUpdate): Promise<Debt> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Debt entry with id ${id} not found`);
      }
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update debt entry: ${response.statusText}`);
    }
    const result: APIResponse<Debt> = await response.json();
    if (!result.data) {
      throw new Error('No data returned from API');
    }
    return result.data;
  },
};

