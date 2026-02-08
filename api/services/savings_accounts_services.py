import sqlite3
from datetime import datetime
from typing import Dict, Any, List, Optional

from db import get_connection
from dtos.savings_account import SavingsAccountCreate, SavingsAccountUpdate
from exceptions import ValidationError


def create_savings_account(entry: SavingsAccountCreate) -> Dict[str, Any]:
    """Create a new savings account and return it with its ID.

    The SavingsAccountCreate DTO is validated automatically by Pydantic,
    ensuring no None values are present.
    """
    if entry.base_balance < 0:
        raise ValidationError("Savings account base_balance cannot be negative")

    # Currency defaults to EUR in the DTO, but ensure it's set
    currency = getattr(entry, 'currency', 'EUR') or 'EUR'

    conn = get_connection()
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO savings_accounts (name, base_balance, currency, bank_institution, created_at) VALUES (?, ?, ?, ?, ?)",
        (entry.name, entry.base_balance, currency, entry.bank_institution, created_at)
    )
    account_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {
        "id": account_id,
        "name": entry.name,
        "base_balance": entry.base_balance,
        "currency": currency,
        "bank_institution": entry.bank_institution,
        "created_at": created_at,
        "updated_at": None
    }


def delete_savings_account(account_id: int) -> bool:
    """Delete a savings account by ID. Returns True if deleted, False if not found."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM savings_accounts WHERE id = ?", (account_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted


def get_all_savings_accounts() -> List[Dict[str, Any]]:
    """Get all savings accounts."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, base_balance, currency, bank_institution, created_at, updated_at FROM savings_accounts ORDER BY id DESC")
    entries = [dict(row) for row in cursor.fetchall()]
    # Ensure currency defaults to EUR for existing entries without currency
    for entry in entries:
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
    conn.close()
    return entries


def get_savings_account_by_id(account_id: int) -> Optional[Dict[str, Any]]:
    """Get a single savings account by ID."""
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, base_balance, currency, bank_institution, created_at, updated_at FROM savings_accounts WHERE id = ?", (account_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR for existing entries without currency
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
    return None


def update_savings_account(account_id: int, entry_update: SavingsAccountUpdate, existing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a savings account and return the updated account.

    The SavingsAccountUpdate DTO is validated automatically by Pydantic,
    ensuring that if fields are provided, they cannot be None.

    Args:
        account_id: The ID of the account to update
        entry_update: The update DTO with validated fields
        existing: The existing account data to fill in missing fields
    """
    # Use provided values or keep existing ones
    name = entry_update.name if entry_update.name is not None else existing["name"]
    base_balance = entry_update.base_balance if entry_update.base_balance is not None else existing["base_balance"]

    # Validate base_balance
    if base_balance < 0:
        raise ValidationError("Savings account base_balance cannot be negative")

    # Default to EUR if currency is not provided in update or existing entry
    existing_currency = existing.get("currency", "EUR")
    currency = entry_update.currency if entry_update.currency is not None else existing_currency

    # Handle bank_institution
    bank_institution = entry_update.bank_institution if entry_update.bank_institution is not None else existing.get("bank_institution")

    conn = get_connection()
    cursor = conn.cursor()
    updated_at = datetime.now().isoformat()
    cursor.execute(
        "UPDATE savings_accounts SET name = ?, base_balance = ?, currency = ?, bank_institution = ?, updated_at = ? WHERE id = ?",
        (name, base_balance, currency, bank_institution, updated_at, account_id)
    )
    conn.commit()
    updated = cursor.rowcount > 0
    conn.close()
    if updated:
        return {
            "id": account_id,
            "name": name,
            "base_balance": base_balance,
            "currency": currency,
            "bank_institution": bank_institution,
            "created_at": existing.get("created_at", datetime.now().isoformat()),
            "updated_at": updated_at
        }
    return None
