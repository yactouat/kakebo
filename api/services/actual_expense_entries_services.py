import sqlite3
from typing import List, Optional, Dict, Any

from db import get_connection
from dtos.actual_expense_entry import ActualExpenseEntryCreate, ActualExpenseEntryUpdate
from exceptions import ValidationError
from validators.month_validator import validate_month_format


def bulk_delete_actual_expense_entries(entry_ids: List[int]) -> int:
    """Delete multiple actual expense entries by IDs. Returns the number of deleted entries."""
    if not entry_ids:
        return 0
    
    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ','.join('?' * len(entry_ids))
    cursor.execute(f"DELETE FROM actual_expense_entries WHERE id IN ({placeholders})", entry_ids)
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted_count


def bulk_update_actual_expense_entries(entry_ids: List[int], entry_update: ActualExpenseEntryUpdate) -> int:
    """Update multiple actual expense entries with the same update data. Returns the number of updated entries."""
    if not entry_ids:
        return 0
    
    # Get all existing entries to fill in missing fields
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    placeholders = ','.join('?' * len(entry_ids))
    cursor.execute(f"SELECT id, amount, date, item, category, currency FROM actual_expense_entries WHERE id IN ({placeholders})", entry_ids)
    existing_entries = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    if not existing_entries:
        return 0
    
    # Prepare update values - use provided values or keep existing ones
    # For bulk update, we'll use the first entry's existing values as defaults
    first_existing = existing_entries[0]
    amount = entry_update.amount if entry_update.amount is not None else first_existing["amount"]
    date = entry_update.date if entry_update.date is not None else first_existing["date"]
    item = entry_update.item if entry_update.item is not None else first_existing["item"]
    category = entry_update.category.value if entry_update.category is not None else first_existing["category"]
    existing_currency = first_existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency
    
    # Update all entries
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE actual_expense_entries SET amount = ?, date = ?, item = ?, category = ?, currency = ? WHERE id IN ({placeholders})",
        (amount, date, item, category, currency, *entry_ids)
    )
    updated_count = cursor.rowcount
    conn.commit()
    conn.close()
    return updated_count


def create_actual_expense_entry(entry: ActualExpenseEntryCreate) -> Dict[str, Any]:
    """Create a new actual expense entry and return it with its ID.
    
    The ActualExpenseEntryCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.amount < 0:
        raise ValidationError("Actual expense entry amount cannot be negative")
    
    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO actual_expense_entries (amount, date, item, category, currency) VALUES (?, ?, ?, ?, ?)",
        (entry.amount, entry.date, entry.item, entry.category.value, currency)
    )
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": entry_id,
        "amount": entry.amount,
        "date": entry.date,
        "item": entry.item,
        "category": entry.category.value,
        "currency": currency
    }


def delete_actual_expense_entry(entry_id: int) -> bool:
    """Delete an actual expense entry by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM actual_expense_entries WHERE id = ?", (entry_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_actual_expense_entries_by_month(month: str) -> List[Dict[str, Any]]:
    """Get all actual expense entries for a specific month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2026-01" for January 2026)
    
    Returns:
        List of actual expense entries for the specified month
    
    Raises:
        ValidationError: If the month format is invalid
    """
    # Validate month format: YYYY-MM
    validate_month_format(month)
    
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, amount, date, item, category, currency FROM actual_expense_entries WHERE date LIKE ? ORDER BY date DESC, id DESC",
        (f"{month}%",)
    )
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
    conn.close()
    return entries


def get_actual_expense_entry_by_id(entry_id: int) -> Optional[Dict[str, Any]]:
    """Get a single actual expense entry by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, amount, date, item, category, currency FROM actual_expense_entries WHERE id = ?",
        (entry_id,)
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
    return None


def update_actual_expense_entry(entry_id: int, entry_update: ActualExpenseEntryUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update an actual expense entry and return the updated entry.
    
    The ActualExpenseEntryUpdate DTO is validated automatically by Pydantic,
    ensuring that if fields are provided, they cannot be None.
    
    Args:
        entry_id: The ID of the entry to update
        entry_update: The update DTO with validated fields
        existing: The existing entry data to fill in missing fields
    """
    # Use provided values or keep existing ones
    # The validation ensures that if a field is provided, it's not None
    amount = entry_update.amount if entry_update.amount is not None else existing["amount"]
    date = entry_update.date if entry_update.date is not None else existing["date"]
    item = entry_update.item if entry_update.item is not None else existing["item"]
    category = entry_update.category.value if entry_update.category is not None else existing["category"]
    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE actual_expense_entries SET amount = ?, date = ?, item = ?, category = ?, currency = ? WHERE id = ?",
        (amount, date, item, category, currency, entry_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {
            "id": entry_id,
            "amount": amount,
            "date": date,
            "item": item,
            "category": category,
            "currency": currency
        }
    return None


def merge_actual_expense_entries(entry_ids: List[int]) -> Dict[str, Any]:
    """Merge multiple actual expense entries into one.
    
    Merges entries by:
    - Summing amounts
    - Combining items (comma-separated)
    - Using earliest date
    - Using first entry's category
    - Using first entry's currency
    
    Args:
        entry_ids: List of entry IDs to merge (must have at least 2)
    
    Returns:
        The merged entry with its new ID
    
    Raises:
        ValidationError: If less than 2 entries provided or entries not found
    """
    if len(entry_ids) < 2:
        raise ValidationError("At least 2 entries are required to merge")
    
    # Get all entries to merge
    entries = []
    for entry_id in entry_ids:
        entry = get_actual_expense_entry_by_id(entry_id)
        if entry is None:
            raise ValidationError(f"Actual expense entry with id {entry_id} not found")
        entries.append(entry)
    
    # Calculate merged values
    merged_amount = sum(entry["amount"] for entry in entries)
    merged_items = ", ".join(entry["item"] for entry in entries if entry.get("item"))
    merged_date = min(entry["date"] for entry in entries)
    merged_currency = entries[0].get("currency", "EUR")
    # Use first entry's category (stored as string in DB)
    from dtos.actual_expense_entry import ExpenseCategory
    merged_category_str = entries[0].get("category", "essential")
    # Convert string to enum
    try:
        merged_category = ExpenseCategory(merged_category_str)
    except ValueError:
        merged_category = ExpenseCategory.ESSENTIAL
    
    # Create merged entry
    merged_entry = create_actual_expense_entry(ActualExpenseEntryCreate(
        amount=merged_amount,
        date=merged_date,
        item=merged_items,
        category=merged_category,
        currency=merged_currency
    ))
    
    # Delete original entries
    bulk_delete_actual_expense_entries(entry_ids)
    
    return merged_entry
