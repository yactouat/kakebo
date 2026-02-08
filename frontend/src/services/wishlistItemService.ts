import type { APIResponse } from '../types/api';
import type { Project } from '../models/Project';
import type { WishlistItem } from '../models/WishlistItem';
import type {
  WishlistItemBulkDelete,
  WishlistItemBulkPurchase,
  WishlistItemCreate,
  WishlistItemMove,
  WishlistItemUpdate,
} from '../dtos/wishlistItem';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = `${getApiBaseUrl()}/wishlist-items`;

export const wishlistItemService = {
  async bulkDelete(entry: WishlistItemBulkDelete): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/bulk/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to delete items: ${response.statusText}`);
    }
    const result: APIResponse<{ deleted_count: number }> = await response.json();
    return result.data?.deleted_count || 0;
  },

  async bulkMove(entry: WishlistItemMove): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/bulk/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to move items: ${response.statusText}`);
    }
    const result: APIResponse<{ moved_count: number }> = await response.json();
    return result.data?.moved_count || 0;
  },

  async bulkPurchase(entry: WishlistItemBulkPurchase): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/bulk/purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update items: ${response.statusText}`);
    }
    const result: APIResponse<{ updated_count: number }> = await response.json();
    return result.data?.updated_count || 0;
  },

  async create(entry: WishlistItemCreate, file?: File | null): Promise<WishlistItem> {
    const formData = new FormData();
    formData.append('wishlist_id', entry.wishlist_id.toString());
    formData.append('name', entry.name);
    if (entry.description) formData.append('description', entry.description);
    if (entry.amount !== null && entry.amount !== undefined) formData.append('amount', entry.amount.toString());
    formData.append('currency', entry.currency);
    if (entry.priority !== null && entry.priority !== undefined) formData.append('priority', entry.priority.toString());
    if (entry.notes) formData.append('notes', entry.notes);
    if (entry.url) formData.append('url', entry.url);
    if (file) formData.append('uploaded_file', file);

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to create wishlist item: ${response.statusText}`);
    }
    const result: APIResponse<WishlistItem> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist item with id ${id} not found`);
      throw new Error(`Failed to delete wishlist item: ${response.statusText}`);
    }
  },

  async exportToProject(id: number): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/${id}/export-to-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to export item: ${response.statusText}`);
    }
    const result: APIResponse<Project> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async getAll(wishlistId: number, showPurchased: boolean = false): Promise<WishlistItem[]> {
    const params = new URLSearchParams();
    params.append('wishlist_id', wishlistId.toString());
    params.append('show_purchased', showPurchased.toString());

    const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`Failed to fetch wishlist items: ${response.statusText}`);
    const result: APIResponse<WishlistItem[]> = await response.json();
    return result.data || [];
  },

  async getById(id: number): Promise<WishlistItem> {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist item with id ${id} not found`);
      throw new Error(`Failed to fetch wishlist item: ${response.statusText}`);
    }
    const result: APIResponse<WishlistItem> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async update(id: number, entry: WishlistItemUpdate, file?: File | null): Promise<WishlistItem> {
    const formData = new FormData();
    if (entry.name !== undefined) formData.append('name', entry.name);
    if (entry.description !== undefined && entry.description !== null) formData.append('description', entry.description);
    if (entry.amount !== undefined && entry.amount !== null) formData.append('amount', entry.amount.toString());
    if (entry.currency !== undefined) formData.append('currency', entry.currency);
    if (entry.priority !== undefined && entry.priority !== null) formData.append('priority', entry.priority.toString());
    if (entry.notes !== undefined && entry.notes !== null) formData.append('notes', entry.notes);
    if (entry.url !== undefined && entry.url !== null) formData.append('url', entry.url);
    if (entry.purchased !== undefined) formData.append('purchased', entry.purchased.toString());
    if (file) formData.append('uploaded_file', file);

    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist item with id ${id} not found`);
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to update wishlist item: ${response.statusText}`);
    }
    const result: APIResponse<WishlistItem> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },

  async swapPriority(id: number, direction: 'up' | 'down'): Promise<WishlistItem> {
    const response = await fetch(`${API_BASE_URL}/${id}/swap-priority?direction=${direction}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error(`Wishlist item with id ${id} not found`);
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || `Failed to swap priority: ${response.statusText}`);
    }
    const result: APIResponse<WishlistItem> = await response.json();
    if (!result.data) throw new Error('No data returned from API');
    return result.data;
  },
};
