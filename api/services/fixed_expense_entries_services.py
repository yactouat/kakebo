import sqlite3
from typing import List, Optional, Dict, Any

from db import get_connection
from dtos.fixed_expense_entry import FixedExpenseEntryCreate, FixedExpenseEntryUpdate
from exceptions import ValidationError


def create_fixed_expense_entry(entry: FixedExpenseEntryCreate) -> Dict[str, Any]:
    """Create a new fixed expense entry and return it with its ID.
    
    The FixedExpenseEntryCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.amount < 0:
        raise ValidationError("Fixed expense entry amount cannot be negative")
    
    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO fixed_expense_entries (amount, item, currency) VALUES (?, ?, ?)",
        (entry.amount, entry.item, currency)
    )
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": entry_id, "amount": entry.amount, "item": entry.item, "currency": currency}


def get_all_fixed_expense_entries() -> List[Dict[str, Any]]:
    """Get all fixed expense entries.
    
    Returns:
        List of all fixed expense entries
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, amount, item, currency FROM fixed_expense_entries ORDER BY id DESC"
    )
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
    conn.close()
    return entries


def get_fixed_expense_entry_by_id(entry_id: int) -> Optional[Dict[str, Any]]:
    """Get a single fixed expense entry by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, amount, item, currency FROM fixed_expense_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
    return None


def update_fixed_expense_entry(entry_id: int, entry_update: FixedExpenseEntryUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a fixed expense entry and return the updated entry.
    
    The FixedExpenseEntryUpdate DTO is validated automatically by Pydantic,
    ensuring that if fields are provided, they cannot be None.
    
    Args:
        entry_id: The ID of the entry to update
        entry_update: The update DTO with validated fields
        existing: The existing entry data to fill in missing fields
    """
    # Use provided values or keep existing ones
    # The validation ensures that if a field is provided, it's not None
    amount = entry_update.amount if entry_update.amount is not None else existing["amount"]
    item = entry_update.item if entry_update.item is not None else existing["item"]
    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE fixed_expense_entries SET amount = ?, item = ?, currency = ? WHERE id = ?",
        (amount, item, currency, entry_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {"id": entry_id, "amount": amount, "item": item, "currency": currency}
    return None


def delete_fixed_expense_entry(entry_id: int) -> bool:
    """Delete a fixed expense entry by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fixed_expense_entries WHERE id = ?", (entry_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

