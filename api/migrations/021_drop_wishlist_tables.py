"""Migration to drop wishlist_items and wishlists tables."""
import sqlite3


def up(cursor: sqlite3.Cursor):
    """Drop wishlist_items and wishlists tables if they exist."""
    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='wishlist_items'
    """)
    has_wishlist_items = cursor.fetchone()[0] > 0

    if has_wishlist_items:
        cursor.execute("DROP TABLE wishlist_items")
        print("Migration 021: Dropped wishlist_items table")

    cursor.execute("""
        SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='wishlists'
    """)
    has_wishlists = cursor.fetchone()[0] > 0

    if has_wishlists:
        cursor.execute("DROP TABLE wishlists")
        print("Migration 021: Dropped wishlists table")

    if not has_wishlist_items and not has_wishlists:
        print("Migration 021: Wishlist tables did not exist, skipping")
