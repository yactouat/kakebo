import sqlite3
from typing import Optional, Dict, Any

from db import get_connection
from dtos.actual_expense_entry import ActualExpenseEntryCreate, ExpenseCategory
from dtos.income_entry import IncomeEntryCreate
from services.actual_expense_entries_services import create_actual_expense_entry
from services.available_cash_services import calculate_available_cash
from services.income_entries_services import create_income_entry
from utils.month_utils import format_month_name_for_balance


def create_or_update_balance_entry(month: str, available_cash: float) -> Optional[Dict[str, Any]]:
    """Create or update a balance entry based on available cash for a month.
    
    If available_cash > 0, creates/updates an income entry.
    If available_cash < 0, creates/updates an actual expense entry.
    If available_cash == 0, returns None (no balance entry needed).
    
    Args:
        month: Month string in YYYY-MM format
        available_cash: The calculated available cash amount
    
    Returns:
        The created or updated entry, or None if available_cash is 0
    """
    # If available cash is 0, no balance entry is needed
    if available_cash == 0:
        return None
    
    balance_item_name = format_month_name_for_balance(month)
    # Use first day of the month for the date
    date_str = f"{month}-01"
    amount = abs(available_cash)
    
    if available_cash > 0:
        # Create or update income entry
        existing = find_balance_entry_by_month(month, is_income=True)
        
        if existing:
            # Update existing income entry
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE income_entries SET amount = ?, date = ? WHERE id = ?",
                (amount, date_str, existing["id"])
            )
            conn.commit()
            conn.close()
            return {
                "id": existing["id"],
                "amount": amount,
                "date": date_str,
                "item": balance_item_name,
                "currency": existing.get("currency", "EUR")
            }
        else:
            # Create new income entry
            entry = IncomeEntryCreate(
                amount=amount,
                date=date_str,
                item=balance_item_name,
                currency="EUR"
            )
            return create_income_entry(entry)
    else:
        # Create or update actual expense entry
        existing = find_balance_entry_by_month(month, is_income=False)
        
        if existing:
            # Update existing actual expense entry
            conn = get_connection()
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE actual_expense_entries SET amount = ?, date = ? WHERE id = ?",
                (amount, date_str, existing["id"])
            )
            conn.commit()
            conn.close()
            return {
                "id": existing["id"],
                "amount": amount,
                "date": date_str,
                "item": balance_item_name,
                "category": existing.get("category", ExpenseCategory.UNFORESEEN.value),
                "currency": existing.get("currency", "EUR")
            }
        else:
            # Create new actual expense entry
            entry = ActualExpenseEntryCreate(
                amount=amount,
                date=date_str,
                item=balance_item_name,
                category=ExpenseCategory.UNFORESEEN,
                currency="EUR"
            )
            return create_actual_expense_entry(entry)


def find_balance_entry_by_month(month: str, is_income: bool) -> Optional[Dict[str, Any]]:
    """Find a balance entry for a given month by item name pattern.
    
    Args:
        month: Month string in YYYY-MM format
        is_income: True to search in income entries, False to search in actual expense entries
    
    Returns:
        The balance entry if found, None otherwise
    """
    balance_item_name = format_month_name_for_balance(month)
    
    conn = get_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if is_income:
        cursor.execute(
            "SELECT id, amount, date, item, currency FROM income_entries WHERE item = ?",
            (balance_item_name,)
        )
    else:
        cursor.execute(
            "SELECT id, amount, date, item, category, currency FROM actual_expense_entries WHERE item = ?",
            (balance_item_name,)
        )
    
    row = cursor.fetchone()
    conn.close()
    
    if row:
        entry = dict(row)
        # Ensure currency defaults to EUR
        if 'currency' not in entry or entry['currency'] is None:
            entry['currency'] = 'EUR'
        return entry
    return None


def update_balance_entry_for_month(month: str) -> Optional[Dict[str, Any]]:
    """Recalculate available cash for a month and update/create balance entry.
    
    Args:
        month: Month string in YYYY-MM format
    
    Returns:
        The created or updated balance entry, or None if calculation failed
    """
    try:
        result = calculate_available_cash(month)
        available_cash = result["available_cash"]
        return create_or_update_balance_entry(month, available_cash)
    except Exception:
        return None

