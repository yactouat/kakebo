import sqlite3
import re
from typing import List, Optional, Dict, Any

from db import get_connection
from dtos.income_entry import IncomeEntryCreate, IncomeEntryUpdate


class ValidationError(Exception):
    """Raised when validation fails for income entry data."""
    pass


def create_income_entry(entry: IncomeEntryCreate) -> Dict[str, Any]:
    """Create a new income entry and return it with its ID.
    
    The IncomeEntryCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.amount < 0:
        raise ValidationError("Income entry amount cannot be negative")
    
    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO income_entries (amount, date, item, currency) VALUES (?, ?, ?, ?)",
        (entry.amount, entry.date, entry.item, currency)
    )
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": entry_id, "amount": entry.amount, "date": entry.date, "item": entry.item, "currency": currency}


def get_all_income_entries_by_month(month: str) -> List[Dict[str, Any]]:
    """Get all income entries for a specific month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2026-01" for January 2026)
    
    Returns:
        List of income entries for the specified month
    
    Raises:
        ValidationError: If the month format is invalid
    """
    # Validate month format: YYYY-MM
    month_pattern = re.compile(r'^\d{4}-\d{2}$')
    if not month_pattern.match(month):
        raise ValidationError(f"Invalid month format. Expected YYYY-MM (e.g., '2026-01'), got '{month}'")
    
    # Validate that month is between 01-12
    try:
        year, month_num = month.split('-')
        month_int = int(month_num)
        if month_int < 1 or month_int > 12:
            raise ValidationError(f"Invalid month number. Month must be between 01-12, got '{month_num}'")
    except ValueError:
        raise ValidationError(f"Invalid month format. Expected YYYY-MM (e.g., '2026-01'), got '{month}'")
    
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, amount, date, item, currency FROM income_entries WHERE date LIKE ? ORDER BY date DESC, id DESC",
        (f"{month}%",)
    )
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
    conn.close()
    return entries


def get_income_entry_by_id(entry_id: int) -> Optional[Dict[str, Any]]:
    """Get a single income entry by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, amount, date, item, currency FROM income_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
    return None


def update_income_entry(entry_id: int, entry_update: IncomeEntryUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update an income entry and return the updated entry.
    
    The IncomeEntryUpdate DTO is validated automatically by Pydantic,
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
    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE income_entries SET amount = ?, date = ?, item = ?, currency = ? WHERE id = ?",
        (amount, date, item, currency, entry_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {"id": entry_id, "amount": amount, "date": date, "item": item, "currency": currency}
    return None


def delete_income_entry(entry_id: int) -> bool:
    """Delete an income entry by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM income_entries WHERE id = ?", (entry_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

