import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime

from db import get_connection
from dtos.fixed_expense_entry import FixedExpenseEntryCreate, FixedExpenseEntryUpdate
from exceptions import ValidationError
from validators.month_validator import validate_month_format
from utils.merge_utils import validate_and_fetch_entries, calculate_common_merged_values


def bulk_delete_fixed_expense_entries(entry_ids: List[int]) -> int:
    """Delete multiple fixed expense entries by IDs. Returns the number of deleted entries."""
    if not entry_ids:
        return 0
    
    conn = get_connection()
    cursor = conn.cursor()
    placeholders = ','.join('?' * len(entry_ids))
    cursor.execute(f"DELETE FROM fixed_expense_entries WHERE id IN ({placeholders})", entry_ids)
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    return deleted_count


def bulk_update_fixed_expense_entries(entry_ids: List[int], entry_update: FixedExpenseEntryUpdate) -> int:
    """Update multiple fixed expense entries with the same update data. Returns the number of updated entries."""
    if not entry_ids:
        return 0
    
    # Get all existing entries to fill in missing fields
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    placeholders = ','.join('?' * len(entry_ids))
    cursor.execute(f"SELECT id, amount, item, currency, month, year FROM fixed_expense_entries WHERE id IN ({placeholders})", entry_ids)
    existing_entries = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    if not existing_entries:
        return 0
    
    # Prepare update values - use provided values or keep existing ones
    # For bulk update, we'll use the first entry's existing values as defaults
    first_existing = existing_entries[0]
    amount = entry_update.amount if entry_update.amount is not None else first_existing["amount"]
    item = entry_update.item if entry_update.item is not None else first_existing["item"]
    existing_currency = first_existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency
    month = entry_update.month if entry_update.month is not None else first_existing.get("month", datetime.now().month)
    year = entry_update.year if entry_update.year is not None else first_existing.get("year", datetime.now().year)
    
    # Update all entries
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        f"UPDATE fixed_expense_entries SET amount = ?, item = ?, currency = ?, month = ?, year = ? WHERE id IN ({placeholders})",
        (amount, item, currency, month, year, *entry_ids)
    )
    updated_count = cursor.rowcount
    conn.commit()
    conn.close()
    return updated_count


def copy_fixed_expense_entries_to_next_month() -> int:
    """Copy all fixed expense entries from current month to next month.
    
    Returns:
        Number of entries copied
    
    Raises:
        ValidationError: If the current month has no entries or if validation fails
    """
    current_date = datetime.now()
    current_month = current_date.month
    current_year = current_date.year
    
    # Calculate next month and year (handle year rollover)
    if current_month == 12:
        next_month = 1
        next_year = current_year + 1
    else:
        next_month = current_month + 1
        next_year = current_year
    
    # Get all entries from current month
    current_month_str = f"{current_year}-{current_month:02d}"
    entries = get_all_fixed_expense_entries_by_month(current_month_str)
    
    if not entries:
        raise ValidationError(f"No fixed expense entries found for current month ({current_month_str})")
    
    # Copy each entry to next month
    conn = get_connection()
    cursor = conn.cursor()
    copied_count = 0
    
    for entry in entries:
        cursor.execute(
            "INSERT INTO fixed_expense_entries (amount, item, currency, month, year) VALUES (?, ?, ?, ?, ?)",
            (entry['amount'], entry['item'], entry.get('currency', 'EUR'), next_month, next_year)
        )
        copied_count += 1
    
    conn.commit()
    conn.close()
    
    return copied_count


def create_fixed_expense_entry(entry: FixedExpenseEntryCreate) -> Dict[str, Any]:
    """Create a new fixed expense entry and return it with its ID.
    
    The FixedExpenseEntryCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.amount < 0:
        raise ValidationError("Fixed expense entry amount cannot be negative")
    
    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'
    
    # default to current month/year if not provided
    current_date = datetime.now()
    month = entry.month if entry.month is not None else current_date.month
    year = entry.year if entry.year is not None else current_date.year
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO fixed_expense_entries (amount, item, currency, month, year) VALUES (?, ?, ?, ?, ?)",
        (entry.amount, entry.item, currency, month, year)
    )
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": entry_id, "amount": entry.amount, "item": entry.item, "currency": currency, "month": month, "year": year}


def delete_fixed_expense_entry(entry_id: int) -> bool:
    """Delete a fixed expense entry by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fixed_expense_entries WHERE id = ?", (entry_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_fixed_expense_entries_by_month(month: str) -> List[Dict[str, Any]]:
    """Get all fixed expense entries for a specific month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2026-01" for January 2026)
    
    Returns:
        List of fixed expense entries for the specified month
    
    Raises:
        ValidationError: If the month format is invalid
    """
    # Validate month format: YYYY-MM
    validate_month_format(month)
    
    # Parse month string to get year and month
    year_str, month_str = month.split('-')
    year = int(year_str)
    month_num = int(month_str)
    
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    # Filter by month and year
    cursor.execute(
        "SELECT id, amount, item, currency, month, year FROM fixed_expense_entries WHERE month = ? AND year = ? ORDER BY id DESC",
        (month_num, year)
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
    cursor.execute("SELECT id, amount, item, currency, month, year FROM fixed_expense_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        # Ensure month and year are set (fallback for edge cases)
        if 'month' not in entry or entry['month'] is None:
            entry['month'] = datetime.now().month
        if 'year' not in entry or entry['year'] is None:
            entry['year'] = datetime.now().year
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
    
    # Handle month and year - use provided values or keep existing
    month = entry_update.month if entry_update.month is not None else existing.get("month", datetime.now().month)
    year = entry_update.year if entry_update.year is not None else existing.get("year", datetime.now().year)
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE fixed_expense_entries SET amount = ?, item = ?, currency = ?, month = ?, year = ? WHERE id = ?",
        (amount, item, currency, month, year, entry_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {"id": entry_id, "amount": amount, "item": item, "currency": currency, "month": month, "year": year}
    return None


def merge_fixed_expense_entries(entry_ids: List[int]) -> Dict[str, Any]:
    """Merge multiple fixed expense entries into one.
    
    Merges entries by:
    - Summing amounts
    - Combining items (comma-separated)
    - Using most recent month/year
    - Using first entry's currency
    
    Args:
        entry_ids: List of entry IDs to merge (must have at least 2)
    
    Returns:
        The merged entry with its new ID
    
    Raises:
        ValidationError: If less than 2 entries provided or entries not found
    """
    # Validate and fetch all entries to merge
    entries = validate_and_fetch_entries(
        entry_ids,
        get_fixed_expense_entry_by_id,
        "Fixed expense entry"
    )
    
    # Calculate common merged values
    common_values = calculate_common_merged_values(entries)
    
    # Calculate merged values specific to fixed expense entries
    # Use most recent month/year (compare by year first, then month)
    most_recent_entry = max(entries, key=lambda e: (e.get("year", 0), e.get("month", 0)))
    merged_month = most_recent_entry.get("month", datetime.now().month)
    merged_year = most_recent_entry.get("year", datetime.now().year)
    
    # Create merged entry
    merged_entry = create_fixed_expense_entry(FixedExpenseEntryCreate(
        amount=common_values["amount"],
        item=common_values["items"],
        currency=common_values["currency"],
        month=merged_month,
        year=merged_year
    ))
    
    # Delete original entries
    bulk_delete_fixed_expense_entries(entry_ids)
    
    return merged_entry
