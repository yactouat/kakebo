import type { SavingsAccount } from '../models/SavingsAccount';
import type { Project } from '../models/Project';
import type { SavingsAccountCreate, SavingsAccountUpdate } from '../dtos/savingsAccount';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/savings-accounts`;

export const savingsAccountService = {
  async create(entry: SavingsAccountCreate): Promise<SavingsAccount> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create savings account: ${response.statusText}`);
    }
    const result: APIResponse<SavingsAccount> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Savings account with id ${id} not found`);
      throw new Error(`Failed to delete savings account: ${response.statusText}`);
    }
  },

  async getAll(): Promise<SavingsAccount[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error(`Failed to fetch savings accounts: ${response.statusText}`);
    const result: APIResponse<SavingsAccount[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<{ account: SavingsAccount; linked_projects: Project[] }> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Savings account with id ${id} not found`);
      throw new Error(`Failed to fetch savings account: ${response.statusText}`);
    }
    const result: APIResponse<{ account: SavingsAccount; linked_projects: Project[] }> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async update(id: number, entry: SavingsAccountUpdate): Promise<SavingsAccount> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Savings account with id ${id} not found`);
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update savings account: ${response.statusText}`);
    }
    const result: APIResponse<SavingsAccount> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },
};
