/**
 * Gets the API base URL from environment variables.
 * Falls back to 'http://localhost:8000' if not set.
 */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
}

