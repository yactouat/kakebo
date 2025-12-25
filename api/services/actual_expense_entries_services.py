import sqlite3
from typing import List, Optional, Dict, Any

from db import get_connection
from dtos.actual_expense_entry import ActualExpenseEntryCreate, ActualExpenseEntryUpdate
from exceptions import ValidationError
from validators.month_validator import validate_month_format


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


def delete_actual_expense_entry(entry_id: int) -> bool:
    """Delete an actual expense entry by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM actual_expense_entries WHERE id = ?", (entry_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

