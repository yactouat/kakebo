import sqlite3
from typing import List, Optional, Dict, Any
from datetime import datetime

from db import get_connection
from dtos.debt_entry import DebtEntryCreate, DebtEntryUpdate
from exceptions import ValidationError
from services.fixed_expense_entries_services import get_fixed_expense_entry_by_id


def create_debt_entry(entry: DebtEntryCreate) -> Dict[str, Any]:
    """Create a new debt entry and return it with its ID.
    
    The DebtEntryCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.initial_amount < 0:
        raise ValidationError("Debt entry initial_amount cannot be negative")
    if entry.current_balance < 0:
        raise ValidationError("Debt entry current_balance cannot be negative")
    if entry.current_balance > entry.initial_amount:
        raise ValidationError("Debt entry current_balance cannot exceed initial_amount")
    
    # Validate linked_fixed_expense_id if provided
    if entry.linked_fixed_expense_id is not None:
        linked_expense = get_fixed_expense_entry_by_id(entry.linked_fixed_expense_id)
        if linked_expense is None:
            raise ValidationError(f"Fixed expense entry with id {entry.linked_fixed_expense_id} not found")
    
    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'
    
    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO debt_entries (name, initial_amount, current_balance, currency, linked_fixed_expense_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (entry.name, entry.initial_amount, entry.current_balance, currency, entry.linked_fixed_expense_id, entry.notes, created_at)
    )
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": entry_id,
        "name": entry.name,
        "initial_amount": entry.initial_amount,
        "current_balance": entry.current_balance,
        "currency": currency,
        "linked_fixed_expense_id": entry.linked_fixed_expense_id,
        "notes": entry.notes,
        "created_at": created_at
    }


def delete_debt_entry(entry_id: int) -> bool:
    """Delete a debt entry by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM debt_entries WHERE id = ?", (entry_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_debt_entries() -> List[Dict[str, Any]]:
    """Get all debt entries."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, initial_amount, current_balance, currency, linked_fixed_expense_id, notes, created_at FROM debt_entries ORDER BY id DESC")
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
    conn.close()
    return entries


def get_debt_entry_by_id(entry_id: int) -> Optional[Dict[str, Any]]:
    """Get a single debt entry by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, initial_amount, current_balance, currency, linked_fixed_expense_id, notes, created_at FROM debt_entries WHERE id = ?", (entry_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
    return None


def get_debt_entries_with_monthly_reduction(month: str) -> List[Dict[str, Any]]:
    """Get all debt entries with current_balance adjusted for linked fixed expense payments in the specified month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2026-01" for January 2026)
    
    Returns:
        List of debt entries with adjusted current_balance values
    """
    from validators.month_validator import validate_month_format
    from services.fixed_expense_entries_services import get_all_fixed_expense_entries_by_month
    
    # Validate month format
    validate_month_format(month)
    
    # Get all debt entries
    all_debts = get_all_debt_entries()
    
    # Get fixed expenses for the specified month
    fixed_expenses = get_all_fixed_expense_entries_by_month(month)
    fixed_expense_map = {expense['id']: expense for expense in fixed_expenses}
    
    # Adjust debt balances based on linked fixed expenses
    adjusted_debts = []
    for debt in all_debts:
        adjusted_debt = debt.copy()
        linked_expense_id = debt.get('linked_fixed_expense_id')
        
        if linked_expense_id is not None:
            # Check if the linked fixed expense exists for this month
            if linked_expense_id in fixed_expense_map:
                expense_amount = fixed_expense_map[linked_expense_id]['amount']
                # Reduce current_balance by expense amount (minimum 0)
                adjusted_balance = max(0, debt['current_balance'] - expense_amount)
                adjusted_debt['current_balance'] = adjusted_balance
            # If linked expense doesn't exist for this month, keep original balance
        
        adjusted_debts.append(adjusted_debt)
    
    return adjusted_debts


def update_debt_entry(entry_id: int, entry_update: DebtEntryUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a debt entry and return the updated entry.
    
    The DebtEntryUpdate DTO is validated automatically by Pydantic,
    ensuring that if fields are provided, they cannot be None.
    
    Args:
        entry_id: The ID of the entry to update
        entry_update: The update DTO with validated fields
        existing: The existing entry data to fill in missing fields
    """
    # Use provided values or keep existing ones
    name = entry_update.name if entry_update.name is not None else existing["name"]
    initial_amount = entry_update.initial_amount if entry_update.initial_amount is not None else existing["initial_amount"]
    current_balance = entry_update.current_balance if entry_update.current_balance is not None else existing["current_balance"]
    
    # Validate amounts
    if initial_amount < 0:
        raise ValidationError("Debt entry initial_amount cannot be negative")
    if current_balance < 0:
        raise ValidationError("Debt entry current_balance cannot be negative")
    if current_balance > initial_amount:
        raise ValidationError("Debt entry current_balance cannot exceed initial_amount")
    
    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency
    
    # Handle linked_fixed_expense_id
    linked_fixed_expense_id = entry_update.linked_fixed_expense_id if entry_update.linked_fixed_expense_id is not None else existing.get("linked_fixed_expense_id")
    
    # Validate linked_fixed_expense_id if provided
    if linked_fixed_expense_id is not None:
        linked_expense = get_fixed_expense_entry_by_id(linked_fixed_expense_id)
        if linked_expense is None:
            raise ValidationError(f"Fixed expense entry with id {linked_fixed_expense_id} not found")
    
    # Handle notes
    notes = entry_update.notes if entry_update.notes is not None else existing.get("notes")
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE debt_entries SET name = ?, initial_amount = ?, current_balance = ?, currency = ?, linked_fixed_expense_id = ?, notes = ? WHERE id = ?",
        (name, initial_amount, current_balance, currency, linked_fixed_expense_id, notes, entry_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {
            "id": entry_id,
            "name": name,
            "initial_amount": initial_amount,
            "current_balance": current_balance,
            "currency": currency,
            "linked_fixed_expense_id": linked_fixed_expense_id,
            "notes": notes,
            "created_at": existing.get("created_at", datetime.now().isoformat())
        }
    return None

