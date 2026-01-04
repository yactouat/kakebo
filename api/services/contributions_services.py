import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional

from db import get_connection
from dtos.contribution import ContributionCreate, ContributionUpdate
from exceptions import ValidationError
from services.savings_accounts_services import get_savings_account_by_id


def create_contribution(entry: ContributionCreate) -> Dict[str, Any]:
    """Create a new contribution and return it with its ID.

    The ContributionCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.amount < 0:
        raise ValidationError("Contribution amount cannot be negative")

    # Validate savings_account_id exists
    account = get_savings_account_by_id(entry.savings_account_id)
    if account is None:
        raise ValidationError(f"Savings account with id {entry.savings_account_id} not found")

    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO contributions (savings_account_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)",
        (entry.savings_account_id, entry.amount, entry.date, entry.notes, created_at)
    )
    contribution_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": contribution_id,
        "savings_account_id": entry.savings_account_id,
        "amount": entry.amount,
        "date": entry.date,
        "notes": entry.notes,
        "created_at": created_at,
        "updated_at": None
    }


def delete_contribution(contribution_id: int) -> bool:
    """Delete a contribution by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contributions WHERE id = ?", (contribution_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_contributions(savings_account_id: int) -> List[Dict[str, Any]]:
    """Get all contributions for a specific savings account.

    Args:
        savings_account_id: Required filter for savings account

    Returns:
        List of contributions for the specified account, ordered by date descending
    """
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, savings_account_id, amount, date, notes, created_at, updated_at FROM contributions WHERE savings_account_id = ? ORDER BY date DESC, id DESC",
        (savings_account_id,)
    )
    entries = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return entries


def get_contribution_by_id(contribution_id: int) -> Optional[Dict[str, Any]]:
    """Get a single contribution by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, savings_account_id, amount, date, notes, created_at, updated_at FROM contributions WHERE id = ?", (contribution_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def update_contribution(contribution_id: int, entry_update: ContributionUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a contribution and return the updated contribution.

    The ContributionUpdate DTO is validated automatically by Pydantic,
    ensuring that if fields are provided, they cannot be None.

    Args:
        contribution_id: The ID of the contribution to update
        entry_update: The update DTO with validated fields
        existing: The existing contribution data to fill in missing fields
    """
    # Use provided values or keep existing ones
    savings_account_id = entry_update.savings_account_id if entry_update.savings_account_id is not None else existing["savings_account_id"]
    amount = entry_update.amount if entry_update.amount is not None else existing["amount"]
    date = entry_update.date if entry_update.date is not None else existing["date"]
    notes = entry_update.notes if entry_update.notes is not None else existing.get("notes")

    # Validate amount
    if amount < 0:
        raise ValidationError("Contribution amount cannot be negative")

    # Validate savings_account_id exists if changed
    if savings_account_id != existing["savings_account_id"]:
        account = get_savings_account_by_id(savings_account_id)
        if account is None:
            raise ValidationError(f"Savings account with id {savings_account_id} not found")

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    cursor.execute(
        "UPDATE contributions SET savings_account_id = ?, amount = ?, date = ?, notes = ?, updated_at = ? WHERE id = ?",
        (savings_account_id, amount, date, notes, updated_at, contribution_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {
            "id": contribution_id,
            "savings_account_id": savings_account_id,
            "amount": amount,
            "date": date,
            "notes": notes,
            "created_at": existing.get("created_at", datetime.now().isoformat()),
            "updated_at": updated_at
        }
    return None
