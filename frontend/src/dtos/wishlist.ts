export interface WishlistCreate {
  name: string;
  description?: string | null;
}

export interface WishlistUpdate {
  name?: string;
  description?: string | null;
}
