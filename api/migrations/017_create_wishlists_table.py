"""Migration to create wishlists table."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Create wishlists table if it doesn't exist."""
    # Check if wishlists table exists
    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='wishlists'
    """)
    has_wishlists = cursor.fetchone()[0] > 0

    if not has_wishlists:
        cursor.execute("""
            CREATE TABLE wishlists (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT
            )
        """)

        print("Migration 017: Created wishlists table")
    else:
        print("Migration 017: Wishlists table already exists, skipping")
