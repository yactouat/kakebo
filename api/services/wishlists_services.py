"""Service for wishlists management."""
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

from db import get_connection
from dtos.wishlist import WishlistCreate, WishlistUpdate


def create_wishlist(entry: WishlistCreate) -> Dict[str, Any]:
    """Create a new wishlist.

    Args:
        entry: Wishlist creation data

    Returns:
        Created wishlist dictionary with id
    """
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()

    cursor.execute(
        "INSERT INTO wishlists (name, description, created_at) VALUES (?, ?, ?)",
        (entry.name, entry.description, created_at),
    )
    wishlist_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "id": wishlist_id,
        "name": entry.name,
        "description": entry.description,
        "created_at": created_at,
        "updated_at": None,
        "item_count": 0,
    }


def delete_wishlist(wishlist_id: int) -> bool:
    """Delete a wishlist (cascade deletes items).

    Args:
        wishlist_id: ID of wishlist to delete

    Returns:
        True if deleted, False if not found
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM wishlists WHERE id = ?", (wishlist_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_wishlists(search: str | None = None) -> List[Dict[str, Any]]:
    """Get all wishlists with optional search filter.

    Args:
        search: Optional search string for name/description

    Returns:
        List of wishlist dictionaries with item counts
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = """
        SELECT w.id, w.name, w.description, w.created_at, w.updated_at,
               COUNT(CASE WHEN wi.purchased = 0 THEN wi.id END) as item_count
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
    """
    params = []

    if search:
        query += " WHERE LOWER(w.name) LIKE ? OR LOWER(w.description) LIKE ?"
        search_pattern = f"%{search.lower()}%"
        params.extend([search_pattern, search_pattern])

    query += " GROUP BY w.id ORDER BY LOWER(w.name) ASC"

    cursor.execute(query, params)
    wishlists = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return wishlists


def get_wishlist_by_id(wishlist_id: int) -> Optional[Dict[str, Any]]:
    """Get a single wishlist by ID with item count.

    Args:
        wishlist_id: ID of wishlist to retrieve

    Returns:
        Wishlist dictionary or None if not found
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT w.id, w.name, w.description, w.created_at, w.updated_at,
               COUNT(CASE WHEN wi.purchased = 0 THEN wi.id END) as item_count
        FROM wishlists w
        LEFT JOIN wishlist_items wi ON w.id = wi.wishlist_id
        WHERE w.id = ?
        GROUP BY w.id
    """,
        (wishlist_id,),
    )

    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def update_wishlist(
    wishlist_id: int, entry_update: WishlistUpdate, existing: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """Update a wishlist.

    Args:
        wishlist_id: ID of wishlist to update
        entry_update: Update data
        existing: Existing wishlist data

    Returns:
        Updated wishlist dictionary or None if update failed
    """
    name = entry_update.name if entry_update.name is not None else existing["name"]
    description = (
        entry_update.description
        if entry_update.description is not None
        else existing.get("description")
    )

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()

    cursor.execute(
        "UPDATE wishlists SET name = ?, description = ?, updated_at = ? WHERE id = ?",
        (name, description, updated_at, wishlist_id),
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()

    if updated:
        return {
            "id": wishlist_id,
            "name": name,
            "description": description,
            "created_at": existing["created_at"],
            "updated_at": updated_at,
            "item_count": existing.get("item_count", 0),
        }
    return None
