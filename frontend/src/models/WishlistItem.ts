export interface WishlistItem {
  id: number;
  wishlist_id: number;
  name: string;
  description?: string | null;
  amount?: number | null;
  currency: string;
  priority: number;
  notes?: string | null;
  url?: string | null;
  url_preview_image?: string | null;
  uploaded_image?: string | null;
  purchased: boolean;
  purchased_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}
