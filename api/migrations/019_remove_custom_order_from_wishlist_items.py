"""Migration to remove custom_order column from wishlist_items table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Remove custom_order column and its index from wishlist_items table."""
    # Check if wishlist_items table exists
    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='wishlist_items'
    """)
    has_wishlist_items = cursor.fetchone()[0] > 0

    if not has_wishlist_items:
        print("Migration 019: Wishlist_items table does not exist, skipping")
        return

    # Check if custom_order column exists
    cursor.execute("PRAGMA table_info(wishlist_items)")
    columns = [row[1] for row in cursor.fetchall()]
    has_custom_order = 'custom_order' in columns

    if not has_custom_order:
        print("Migration 019: custom_order column does not exist, skipping")
        return

    # Drop the index if it exists
    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master 
        WHERE type='index' AND name='idx_wishlist_items_custom_order'
    """)
    has_index = cursor.fetchone()[0] > 0

    if has_index:
        cursor.execute("DROP INDEX idx_wishlist_items_custom_order")
        print("Migration 019: Dropped idx_wishlist_items_custom_order index")

    # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    # Create new table without custom_order
    cursor.execute("""
        CREATE TABLE wishlist_items_new (
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
            purchased INTEGER NOT NULL DEFAULT 0,
            purchased_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT,
            FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE
        )
    """)

    # Copy data from old table to new table (excluding custom_order)
    cursor.execute("""
        INSERT INTO wishlist_items_new 
        (id, wishlist_id, name, description, amount, currency, priority, notes, url,
         url_preview_image, uploaded_image, purchased, purchased_at, created_at, updated_at)
        SELECT id, wishlist_id, name, description, amount, currency, priority, notes, url,
               url_preview_image, uploaded_image, purchased, purchased_at, created_at, updated_at
        FROM wishlist_items
    """)

    # Drop old table
    cursor.execute("DROP TABLE wishlist_items")

    # Rename new table to original name
    cursor.execute("ALTER TABLE wishlist_items_new RENAME TO wishlist_items")

    # Recreate indexes (except the custom_order one)
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id
        ON wishlist_items(wishlist_id)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_wishlist_items_purchased
        ON wishlist_items(purchased)
    """)

    print("Migration 019: Removed custom_order column from wishlist_items table")

