import type { APIResponse } from '../types/api';
import type { Setting } from '../models/Setting';
import type { SettingUpdate } from '../dtos/setting';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/settings`;

export const settingsService = {
  async get(key: string): Promise<Setting> {
    const response = await fetch(`${API_BASE_URL}/${key}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Setting with key '${key}' not found`);
      throw new Error(`Failed to fetch setting: ${response.statusText}`);
    }
    const result: APIResponse<Setting> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async update(key: string, entry: SettingUpdate): Promise<Setting> {
    const response = await fetch(`${API_BASE_URL}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update setting: ${response.statusText}`);
    }
    const result: APIResponse<Setting> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },
};
