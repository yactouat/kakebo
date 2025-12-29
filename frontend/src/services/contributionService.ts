import type { Contribution } from '../models/Contribution';
import type { ContributionCreate } from '../dtos/contribution';
import type { APIResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL + '/contributions';

export const contributionService = {
  async createContribution(projectId: number, contribution: Omit<ContributionCreate, 'project_id'>): Promise<Contribution> {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/contributions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...contribution, project_id: projectId }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to create contribution: ${response.statusText}`);
      }
      const result: APIResponse<Contribution> = await response.json();
      if (!result.data) {
        throw new Error('No data returned from API');
      }
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create contribution');
    }
  },

  async deleteContribution(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Contribution with id ${id} not found`);
        }
        throw new Error(`Failed to delete contribution: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete contribution');
    }
  },

  async getContributionHistory(projectId: number): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/contributions/history`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contribution history: ${response.statusText}`);
      }
      const result: APIResponse<Record<string, number>> = await response.json();
      return result.data || {};
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch contribution history');
    }
  },

  async getProjectContributions(projectId: number): Promise<Contribution[]> {
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/contributions`);
      if (!response.ok) {
        throw new Error(`Failed to fetch contributions: ${response.statusText}`);
      }
      const result: APIResponse<Contribution[]> = await response.json();
      return result.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch contributions');
    }
  },
};

