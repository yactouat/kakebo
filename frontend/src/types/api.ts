/**
 * Standard API response wrapper used by the backend.
 */
export interface APIResponse<T> {
  data: T | null;
  msg: string;
}

