"""Service for wishlist items management."""
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import UploadFile

from db import get_connection
from dtos.project import ProjectCreate
from dtos.wishlist_item import (
    WishlistItemBulkDelete,
    WishlistItemBulkPurchase,
    WishlistItemCreate,
    WishlistItemMove,
    WishlistItemUpdate,
)
from exceptions import ValidationError
from services.image_services import (
    delete_item_images,
    fetch_url_preview_image,
    save_uploaded_image,
)
from services.projects_services import create_project
from services.wishlists_services import get_wishlist_by_id


async def create_wishlist_item(
    entry: WishlistItemCreate, uploaded_file: Optional[UploadFile] = None
) -> Dict[str, Any]:
    """Create a new wishlist item.

    When a new item is inserted with priority X, all existing items
    in the same wishlist with priority >= X will have their priority incremented by 1
    to make room for the new item.

    Args:
        entry: Item creation data
        uploaded_file: Optional uploaded image file

    Returns:
        Created item dictionary with id

    Raises:
        ValidationError: If wishlist not found or validation fails
    """
    # Validate wishlist exists
    wishlist = get_wishlist_by_id(entry.wishlist_id)
    if wishlist is None:
        raise ValidationError(f"Wishlist with id {entry.wishlist_id} not found")

    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()

    # Find all items in the same wishlist with priority >= the new item's priority
    # These need to be shifted down (incremented by 1)
    # We do this in descending order to avoid uniqueness constraint violations
    cursor.execute(
        """
        SELECT id, priority FROM wishlist_items
        WHERE wishlist_id = ? AND priority >= ?
        ORDER BY priority DESC
    """,
        (entry.wishlist_id, entry.priority),
    )
    items_to_shift = cursor.fetchall()

    # Shift all affected items down (increment their priority by 1)
    updated_at = datetime.now().isoformat()
    for item_row in items_to_shift:
        item_id_to_shift = item_row[0]
        current_priority = item_row[1]
        cursor.execute(
            """
            UPDATE wishlist_items SET priority = ?, updated_at = ? WHERE id = ?
        """,
            (current_priority + 1, updated_at, item_id_to_shift),
        )

    # Insert item
    cursor.execute(
        """
        INSERT INTO wishlist_items
        (wishlist_id, name, description, amount, currency, priority, notes, url,
         purchased, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    """,
        (
            entry.wishlist_id,
            entry.name,
            entry.description,
            entry.amount,
            entry.currency,
            entry.priority,
            entry.notes,
            entry.url,
            created_at,
        ),
    )
    item_id = cursor.lastrowid
    conn.commit()
    conn.close()

    # Handle images (best effort, don't fail item creation)
    url_preview_path = None
    uploaded_image_path = None

    if entry.url:
        url_preview_path = await fetch_url_preview_image(entry.url, item_id)

    if uploaded_file:
        try:
            uploaded_image_path = await save_uploaded_image(uploaded_file, item_id)
        except ValidationError as e:
            # Log error but don't fail creation
            print(f"Failed to save uploaded image: {e}")

    # Update image paths if any succeeded
    if url_preview_path or uploaded_image_path:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE wishlist_items
            SET url_preview_image = ?, uploaded_image = ?
            WHERE id = ?
        """,
            (url_preview_path, uploaded_image_path, item_id),
        )
        conn.commit()
        conn.close()

    return {
        "id": item_id,
        "wishlist_id": entry.wishlist_id,
        "name": entry.name,
        "description": entry.description,
        "amount": entry.amount,
        "currency": entry.currency,
        "priority": entry.priority,
        "notes": entry.notes,
        "url": entry.url,
        "url_preview_image": url_preview_path,
        "uploaded_image": uploaded_image_path,
        "purchased": False,
        "purchased_at": None,
        "created_at": created_at,
        "updated_at": None,
    }


def bulk_delete_items(entry: WishlistItemBulkDelete) -> int:
    """Delete multiple wishlist items. Returns count of deleted items.

    Args:
        entry: Bulk delete request with item IDs

    Returns:
        Number of items deleted
    """
    if not entry.item_ids:
        return 0

    conn = get_connection()
    cursor = conn.cursor()

    placeholders = ",".join("?" * len(entry.item_ids))
    cursor.execute(
        f"DELETE FROM wishlist_items WHERE id IN ({placeholders})", entry.item_ids
    )
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()

    # Clean up images
    for item_id in entry.item_ids:
        delete_item_images(item_id)

    return deleted_count


def bulk_purchase_items(entry: WishlistItemBulkPurchase) -> int:
    """Mark multiple items as purchased/unpurchased. Returns count updated.

    Args:
        entry: Bulk purchase request with item IDs and purchased status

    Returns:
        Number of items updated
    """
    if not entry.item_ids:
        return 0

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    purchased_at = updated_at if entry.purchased else None

    placeholders = ",".join("?" * len(entry.item_ids))
    cursor.execute(
        f"""
        UPDATE wishlist_items
        SET purchased = ?, purchased_at = ?, updated_at = ?
        WHERE id IN ({placeholders})
    """,
        [1 if entry.purchased else 0, purchased_at, updated_at] + entry.item_ids,
    )

    updated_count = cursor.rowcount
    conn.commit()
    conn.close()

    return updated_count


def delete_wishlist_item(item_id: int) -> bool:
    """Delete a wishlist item.

    Args:
        item_id: ID of item to delete

    Returns:
        True if deleted, False if not found
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM wishlist_items WHERE id = ?", (item_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()

    if deleted:
        delete_item_images(item_id)

    return deleted


def export_item_to_project(item_id: int) -> Dict[str, Any]:
    """Export wishlist item to project and delete the item.

    Args:
        item_id: ID of item to export

    Returns:
        Created project dictionary

    Raises:
        ValidationError: If item not found or amount invalid
    """
    item = get_wishlist_item_by_id(item_id)
    if item is None:
        raise ValidationError(f"Wishlist item with id {item_id} not found")

    if item["amount"] is None or item["amount"] <= 0:
        raise ValidationError("Cannot export item without a valid amount")

    # Get max priority_order for projects
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COALESCE(MAX(priority_order), 0) FROM projects")
    max_priority = cursor.fetchone()[0]
    conn.close()

    # Create project from item
    project_data = ProjectCreate(
        name=item["name"],
        description=item["description"] or item["notes"],
        target_amount=item["amount"],
        status="Active",
        savings_account_id=None,
        currency=item["currency"],
        priority_order=max_priority + 1,
    )

    project = create_project(project_data)

    # Delete the wishlist item
    delete_wishlist_item(item_id)

    return project


def get_all_wishlist_items(
    wishlist_id: int, show_purchased: bool = False
) -> List[Dict[str, Any]]:
    """Get all items for a wishlist.

    Args:
        wishlist_id: ID of wishlist
        show_purchased: Whether to include purchased items

    Returns:
        List of item dictionaries
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = """
        SELECT id, wishlist_id, name, description, amount, currency, priority,
               notes, url, url_preview_image, uploaded_image,
               purchased, purchased_at, created_at, updated_at
        FROM wishlist_items
        WHERE wishlist_id = ?
    """
    params = [wishlist_id]

    if not show_purchased:
        query += " AND purchased = 0"

    query += " ORDER BY priority ASC, LOWER(name) ASC"

    cursor.execute(query, params)
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()

    # Convert purchased from int to bool
    for item in items:
        item["purchased"] = bool(item["purchased"])

    return items


def get_wishlist_item_by_id(item_id: int) -> Optional[Dict[str, Any]]:
    """Get a single wishlist item by ID.

    Args:
        item_id: ID of item to retrieve

    Returns:
        Item dictionary or None if not found
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, wishlist_id, name, description, amount, currency, priority,
               notes, url, url_preview_image, uploaded_image,
               purchased, purchased_at, created_at, updated_at
        FROM wishlist_items
        WHERE id = ?
    """,
        (item_id,),
    )

    row = cursor.fetchone()
    conn.close()

    if row:
        item = dict(row)
        item["purchased"] = bool(item["purchased"])
        return item
    return None


def move_items_to_wishlist(entry: WishlistItemMove) -> int:
    """Move items to a different wishlist. Returns count moved.

    Args:
        entry: Move request with item IDs and target wishlist ID

    Returns:
        Number of items moved

    Raises:
        ValidationError: If target wishlist not found
    """
    if not entry.item_ids:
        return 0

    # Validate target wishlist exists
    target = get_wishlist_by_id(entry.target_wishlist_id)
    if target is None:
        raise ValidationError(
            f"Target wishlist with id {entry.target_wishlist_id} not found"
        )

    # Move items
    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()

    # Update each item to move to target wishlist
    for item_id in entry.item_ids:
        cursor.execute(
            """
            UPDATE wishlist_items
            SET wishlist_id = ?, updated_at = ?
            WHERE id = ?
        """,
            (entry.target_wishlist_id, updated_at, item_id),
        )

    moved_count = len(entry.item_ids)
    conn.commit()
    conn.close()

    return moved_count




async def update_wishlist_item(
    item_id: int,
    entry_update: WishlistItemUpdate,
    existing: Dict[str, Any],
    uploaded_file: Optional[UploadFile] = None,
) -> Optional[Dict[str, Any]]:
    """Update a wishlist item.

    Args:
        item_id: ID of item to update
        entry_update: Update data
        existing: Existing item data
        uploaded_file: Optional uploaded image file

    Returns:
        Updated item dictionary or None if update failed
    """
    # Use provided values or keep existing ones
    name = entry_update.name if entry_update.name is not None else existing["name"]
    description = (
        entry_update.description
        if entry_update.description is not None
        else existing.get("description")
    )
    amount = (
        entry_update.amount if entry_update.amount is not None else existing.get("amount")
    )
    currency = (
        entry_update.currency
        if entry_update.currency is not None
        else existing.get("currency", "EUR")
    )
    notes = entry_update.notes if entry_update.notes is not None else existing.get("notes")
    url = entry_update.url if entry_update.url is not None else existing.get("url")
    purchased = (
        entry_update.purchased
        if entry_update.purchased is not None
        else existing["purchased"]
    )

    # Handle priority changes with automatic shifting
    existing_priority = existing.get("priority")
    priority_changed = False
    new_priority = None
    
    if entry_update.priority is not None:
        new_priority = entry_update.priority
        priority = new_priority  # Always set priority when it's provided
        # Only process if the value is actually changing
        if new_priority != existing_priority:
            priority_changed = True
    else:
        priority = existing_priority

    # Handle purchased_at timestamp
    purchased_at = existing.get("purchased_at")
    if entry_update.purchased is not None:
        if entry_update.purchased and not existing["purchased"]:
            # Marking as purchased
            purchased_at = datetime.now().isoformat()
        elif not entry_update.purchased and existing["purchased"]:
            # Unmarking purchased
            purchased_at = None

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    
    # If priority is being changed, shift other items accordingly
    if priority_changed:
        wishlist_id = existing["wishlist_id"]
        if new_priority < existing_priority:
            # Moving to higher priority (lower number): shift items in the gap down
            # Items with priority >= new_priority and < existing_priority need to shift down
            cursor.execute(
                """
                SELECT id, priority FROM wishlist_items
                WHERE wishlist_id = ? AND priority >= ? AND priority < ? AND id != ?
                ORDER BY priority DESC
            """,
                (wishlist_id, new_priority, existing_priority, item_id),
            )
            items_to_shift = cursor.fetchall()
            for item_row in items_to_shift:
                item_id_to_shift = item_row[0]
                current_priority = item_row[1]
                cursor.execute(
                    """
                    UPDATE wishlist_items SET priority = ?, updated_at = ? WHERE id = ?
                """,
                    (current_priority + 1, updated_at, item_id_to_shift),
                )
        elif new_priority > existing_priority:
            # Moving to lower priority (higher number): shift items in the gap up
            # Items with priority > existing_priority and <= new_priority need to shift up
            cursor.execute(
                """
                SELECT id, priority FROM wishlist_items
                WHERE wishlist_id = ? AND priority > ? AND priority <= ? AND id != ?
                ORDER BY priority ASC
            """,
                (wishlist_id, existing_priority, new_priority, item_id),
            )
            items_to_shift = cursor.fetchall()
            for item_row in items_to_shift:
                item_id_to_shift = item_row[0]
                current_priority = item_row[1]
                cursor.execute(
                    """
                    UPDATE wishlist_items SET priority = ?, updated_at = ? WHERE id = ?
                """,
                    (current_priority - 1, updated_at, item_id_to_shift),
                )

    # Handle images
    url_preview_path = existing.get("url_preview_image")
    uploaded_image_path = existing.get("uploaded_image")

    # If URL changed, fetch new preview
    if entry_update.url is not None and entry_update.url != existing.get("url"):
        if entry_update.url:
            new_preview = await fetch_url_preview_image(entry_update.url, item_id)
            if new_preview:
                url_preview_path = new_preview
        else:
            url_preview_path = None

    # If new file uploaded
    if uploaded_file:
        try:
            uploaded_image_path = await save_uploaded_image(uploaded_file, item_id)
        except ValidationError as e:
            print(f"Failed to save uploaded image: {e}")

    cursor.execute(
        """
        UPDATE wishlist_items
        SET name = ?, description = ?, amount = ?, currency = ?, priority = ?,
            notes = ?, url = ?, url_preview_image = ?, uploaded_image = ?,
            purchased = ?, purchased_at = ?, updated_at = ?
        WHERE id = ?
    """,
        (
            name,
            description,
            amount,
            currency,
            priority,
            notes,
            url,
            url_preview_path,
            uploaded_image_path,
            1 if purchased else 0,
            purchased_at,
            updated_at,
            item_id,
        ),
    )

    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()

    if updated:
        return {
            "id": item_id,
            "wishlist_id": existing["wishlist_id"],
            "name": name,
            "description": description,
            "amount": amount,
            "currency": currency,
            "priority": priority,
            "notes": notes,
            "url": url,
            "url_preview_image": url_preview_path,
            "uploaded_image": uploaded_image_path,
            "purchased": purchased,
            "purchased_at": purchased_at,
            "created_at": existing["created_at"],
            "updated_at": updated_at,
        }
    return None


def swap_wishlist_item_priority(item_id: int, direction: str) -> Optional[Dict[str, Any]]:
    """Swap a wishlist item's priority with the adjacent item (up or down).
    
    Args:
        item_id: The ID of the item to move
        direction: Either 'up' (decrease priority) or 'down' (increase priority)
    
    Returns:
        The updated item, or None if the swap couldn't be performed
    """
    if direction not in ['up', 'down']:
        raise ValidationError("Direction must be 'up' or 'down'")
    
    # Get the current item
    current_item = get_wishlist_item_by_id(item_id)
    if current_item is None:
        raise ValidationError(f"Wishlist item with id {item_id} not found")
    
    current_priority = current_item.get("priority")
    if current_priority is None:
        raise ValidationError(f"Wishlist item {item_id} has no priority set")
    
    wishlist_id = current_item["wishlist_id"]
    
    # Determine the target priority
    if direction == 'up':
        target_priority = current_priority - 1
        if target_priority < 1:
            raise ValidationError("Item is already at the highest priority")
    else:  # direction == 'down'
        target_priority = current_priority + 1
    
    # Find the item with the target priority in the same wishlist
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, priority FROM wishlist_items
        WHERE wishlist_id = ? AND priority = ?
    """,
        (wishlist_id, target_priority),
    )
    adjacent_item = cursor.fetchone()
    
    if adjacent_item is None:
        conn.close()
        raise ValidationError(f"No item found with priority {target_priority} in this wishlist")
    
    adjacent_item_id = adjacent_item["id"]
    
    # Swap priorities atomically using a transaction
    # Use a temporary priority value to avoid uniqueness conflicts
    temp_priority = 1000000 + item_id  # Large number to avoid conflicts
    
    try:
        # Move current item to temporary priority
        cursor.execute(
            """
            UPDATE wishlist_items SET priority = ?, updated_at = ? WHERE id = ?
        """,
            (temp_priority, datetime.now().isoformat(), item_id),
        )
        
        # Move adjacent item to current item's priority
        cursor.execute(
            """
            UPDATE wishlist_items SET priority = ?, updated_at = ? WHERE id = ?
        """,
            (current_priority, datetime.now().isoformat(), adjacent_item_id),
        )
        
        # Move current item to adjacent item's priority
        cursor.execute(
            """
            UPDATE wishlist_items SET priority = ?, updated_at = ? WHERE id = ?
        """,
            (target_priority, datetime.now().isoformat(), item_id),
        )
        
        conn.commit()
        
        # Return the updated current item
        updated_item = get_wishlist_item_by_id(item_id)
        conn.close()
        return updated_item
    except Exception as e:
        conn.rollback()
        conn.close()
        raise ValidationError(f"Failed to swap priorities: {str(e)}")
