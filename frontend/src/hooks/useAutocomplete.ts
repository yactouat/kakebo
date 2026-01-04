import { useEffect, useState, useCallback } from 'react';
import { autocompleteApi } from '../services/autocompleteApi';

interface UseAutocompleteOptions {
  entity: string;
  field: string;
  limit?: number;
}

export function useAutocomplete({ entity, field, limit = 50 }: UseAutocompleteOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await autocompleteApi.getSuggestions(entity, field, limit);
      // Sort alphabetically (case-insensitive) for UI display, ignoring usage count
      const sortedData = [...data].sort((a, b) => 
        a.localeCompare(b, undefined, { sensitivity: 'base' })
      );
      setSuggestions(sortedData);
    } catch (error) {
      console.error('Failed to load autocomplete suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [entity, field, limit]);

  const saveSuggestion = useCallback(async (value: string) => {
    if (!value || !value.trim()) {
      return;
    }

    try {
      await autocompleteApi.saveSuggestion(entity, field, value);
      // Reload suggestions to update the list
      await loadSuggestions();
    } catch (error) {
      console.error('Failed to save autocomplete suggestion:', error);
    }
  }, [entity, field, loadSuggestions]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  return {
    suggestions,
    loading,
    loadSuggestions,
    saveSuggestion,
  };
}

