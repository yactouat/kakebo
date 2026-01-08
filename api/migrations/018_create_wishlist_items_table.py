"""Migration to create wishlist_items table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create wishlist_items table if it doesn't exist."""
    # Check if wishlist_items table exists
    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='wishlist_items'
    """)
    has_wishlist_items = cursor.fetchone()[0] > 0

    if not has_wishlist_items:
        cursor.execute("""
            CREATE TABLE wishlist_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wishlist_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                amount REAL,
                currency TEXT NOT NULL DEFAULT 'EUR',
                priority INTEGER,
                notes TEXT,
                url TEXT,
                url_preview_image TEXT,
                uploaded_image TEXT,
                custom_order INTEGER NOT NULL,
                purchased INTEGER NOT NULL DEFAULT 0,
                purchased_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT,
                FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE
            )
        """)

        # Create indexes for performance
        cursor.execute("""
            CREATE INDEX idx_wishlist_items_wishlist_id
            ON wishlist_items(wishlist_id)
        """)

        cursor.execute("""
            CREATE INDEX idx_wishlist_items_purchased
            ON wishlist_items(purchased)
        """)

        cursor.execute("""
            CREATE INDEX idx_wishlist_items_custom_order
            ON wishlist_items(custom_order)
        """)

        print("Migration 018: Created wishlist_items table with indexes")
    else:
        print("Migration 018: Wishlist_items table already exists, skipping")
