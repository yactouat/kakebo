import sqlite3
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
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO income_entries (amount, date, item) VALUES (?, ?, ?)",
        (entry.amount, entry.date, entry.item)
    )
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": entry_id, "amount": entry.amount, "date": entry.date, "item": entry.item}


def get_all_income_entries() -> List[Dict[str, Any]]:
    """Get all income entries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, amount, date, item FROM income_entries ORDER BY date DESC, id DESC")
    entries = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return entries


def get_income_entry_by_id(entry_id: int) -> Optional[Dict[str, Any]]:
    """Get a single income entry by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, amount, date, item FROM income_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


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
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE income_entries SET amount = ?, date = ?, item = ? WHERE id = ?",
        (amount, date, item, entry_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {"id": entry_id, "amount": amount, "date": date, "item": item}
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

