export interface Wishlist {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
  item_count: number;
}
