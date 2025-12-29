import type { Project } from '../models/Project';
import type { ProjectCreate, ProjectUpdate } from '../dtos/project';
import type { APIResponse } from '../types/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL + '/projects';

export const projectService = {
  async createProject(project: ProjectCreate): Promise<Project> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(project),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to create project: ${response.statusText}`);
      }
      const result: APIResponse<Project> = await response.json();
      if (!result.data) {
        throw new Error('No data returned from API');
      }
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create project');
    }
  },

  async deleteProject(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Project with id ${id} not found`);
        }
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete project');
    }
  },

  async getAllProjects(filters?: { status?: string; priority?: string; category?: string }): Promise<Project[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) {
        queryParams.append('status', filters.status);
      }
      if (filters?.priority) {
        queryParams.append('priority', filters.priority);
      }
      if (filters?.category) {
        queryParams.append('category', filters.category);
      }
      const url = queryParams.toString() ? `${API_BASE}?${queryParams.toString()}` : API_BASE;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const result: APIResponse<Project[]> = await response.json();
      return result.data || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch projects');
    }
  },

  async getProjectById(id: number): Promise<Project> {
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Project with id ${id} not found`);
        }
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      const result: APIResponse<Project> = await response.json();
      if (!result.data) {
        throw new Error('No data returned from API');
      }
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch project');
    }
  },

  async updateProject(id: number, updates: ProjectUpdate): Promise<Project> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Project with id ${id} not found`);
        }
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to update project: ${response.statusText}`);
      }
      const result: APIResponse<Project> = await response.json();
      if (!result.data) {
        throw new Error('No data returned from API');
      }
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update project');
    }
  },
};

