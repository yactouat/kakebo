export interface WishlistItemCreate {
  wishlist_id: number;
  name: string;
  description?: string | null;
  amount?: number | null;
  currency: string;
  priority: number;
  notes?: string | null;
  url?: string | null;
}

export interface WishlistItemUpdate {
  name?: string;
  description?: string | null;
  amount?: number | null;
  currency?: string;
  priority?: number | null;
  notes?: string | null;
  url?: string | null;
  purchased?: boolean;
}

export interface WishlistItemBulkDelete {
  item_ids: number[];
}

export interface WishlistItemBulkPurchase {
  item_ids: number[];
  purchased: boolean;
}

export interface WishlistItemMove {
  item_ids: number[];
  target_wishlist_id: number;
}

