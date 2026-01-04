import type { Contribution } from '../models/Contribution';
import type { ContributionCreate, ContributionUpdate } from '../dtos/contribution';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/contributions`;

export const contributionService = {
  async create(entry: ContributionCreate): Promise<Contribution> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create contribution: ${response.statusText}`);
    }
    const result: APIResponse<Contribution> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Contribution with id ${id} not found`);
      throw new Error(`Failed to delete contribution: ${response.statusText}`);
    }
  },

  async getAllByAccount(savingsAccountId: number): Promise<Contribution[]> {
    const response = await fetch(`${API_BASE_URL}?savings_account_id=${savingsAccountId}`);
    if (!response.ok) throw new Error(`Failed to fetch contributions: ${response.statusText}`);
    const result: APIResponse<Contribution[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<Contribution> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Contribution with id ${id} not found`);
      throw new Error(`Failed to fetch contribution: ${response.statusText}`);
    }
    const result: APIResponse<Contribution> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async update(id: number, entry: ContributionUpdate): Promise<Contribution> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Contribution with id ${id} not found`);
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update contribution: ${response.statusText}`);
    }
    const result: APIResponse<Contribution> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },
};
