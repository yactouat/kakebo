import type { Project, ProjectProgress } from '../models/Project';
import type { ProjectCreate, ProjectUpdate } from '../dtos/project';
import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/projects`;

export const projectService = {
  async create(entry: ProjectCreate): Promise<Project> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create project: ${response.statusText}`);
    }
    const result: APIResponse<Project> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Project with id ${id} not found`);
      throw new Error(`Failed to delete project: ${response.statusText}`);
    }
  },

  async getAll(filters?: { status?: string; savings_account_id?: number }): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.savings_account_id) params.append('savings_account_id', filters.savings_account_id.toString());

    const url = params.toString() ? `${API_BASE_URL}?${params.toString()}` : API_BASE_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch projects: ${response.statusText}`);
    const result: APIResponse<Project[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Project with id ${id} not found`);
      throw new Error(`Failed to fetch project: ${response.statusText}`);
    }
    const result: APIResponse<Project> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async getProgress(id: number): Promise<ProjectProgress> {
    const response = await fetch(`${API_BASE_URL}/${id}/progress`);
    if (!response.ok) throw new Error(`Failed to fetch project progress: ${response.statusText}`);
    const result: APIResponse<ProjectProgress> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async update(id: number, entry: ProjectUpdate): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Project with id ${id} not found`);
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update project: ${response.statusText}`);
    }
    const result: APIResponse<Project> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },
};
