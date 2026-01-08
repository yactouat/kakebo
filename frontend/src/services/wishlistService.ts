import type { APIResponse } from '../types/api';
import type { Wishlist } from '../models/Wishlist';
import type { WishlistCreate, WishlistUpdate } from '../dtos/wishlist';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/wishlists`;

export const wishlistService = {
  async create(entry: WishlistCreate): Promise<Wishlist> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create wishlist: ${response.statusText}`);
    }
    const result: APIResponse<Wishlist> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist with id ${id} not found`);
      throw new Error(`Failed to delete wishlist: ${response.statusText}`);
    }
  },

  async getAll(search?: string): Promise<Wishlist[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const url = params.toString() ? `${API_BASE_URL}?${params.toString()}` : API_BASE_URL;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch wishlists: ${response.statusText}`);
    const result: APIResponse<Wishlist[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<Wishlist> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist with id ${id} not found`);
      throw new Error(`Failed to fetch wishlist: ${response.statusText}`);
    }
    const result: APIResponse<Wishlist> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async update(id: number, entry: WishlistUpdate): Promise<Wishlist> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist with id ${id} not found`);
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update wishlist: ${response.statusText}`);
    }
    const result: APIResponse<Wishlist> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },
};
