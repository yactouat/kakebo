import type { APIResponse } from '../types/api';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/autocomplete`;

interface AutocompleteSuggestionsResponse {
  suggestions: string[];
}

export const autocompleteApi = {
  async getSuggestions(entity: string, field: string, limit: number = 50): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(entity)}/${encodeURIComponent(field)}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch autocomplete suggestions: ${response.statusText}`);
    }
    const result: APIResponse<AutocompleteSuggestionsResponse> = await response.json();
    return result.data?.suggestions || [];
  },

  async saveSuggestion(entity: string, field: string, value: string): Promise<void> {
    if (!value || !value.trim()) {
      return;
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entity, field, value: value.trim() }),
    });
    if (!response.ok) {
      // Silently fail - autocomplete saving is not critical
      console.warn(`Failed to save autocomplete suggestion: ${response.statusText}`);
    }
  },
};

