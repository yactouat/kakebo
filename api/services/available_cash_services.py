from typing import Dict, Any

from services.income_entries_services import get_all_income_entries_by_month
from services.fixed_expense_entries_services import get_all_fixed_expense_entries_by_month
from services.actual_expense_entries_services import get_all_actual_expense_entries_by_month
from exceptions import ValidationError
from validators.month_validator import validate_month_format


def calculate_available_cash(month: str) -> Dict[str, Any]:
    """Calculate available cash for a specific month.

    Available cash = Total income for the month - Total fixed expenses - Total actual expenses

    Args:
        month: Month in YYYY-MM format (e.g., "2026-01" for January 2026)

    Returns:
        Dictionary containing:
        - available_cash: The calculated available cash amount
        - total_income: Total income for the month
        - total_fixed_expenses: Total fixed expenses for the month
        - total_actual_expenses: Total actual expenses for the month
        - total_expenses: Total expenses (fixed + actual) for the month
        - month: The month string

    Raises:
        ValidationError: If the month format is invalid
    """
    # Validate month format: YYYY-MM
    validate_month_format(month)

    # Get total income for the month
    income_entries = get_all_income_entries_by_month(month)
    total_income = sum(entry["amount"] for entry in income_entries)

    # Get total fixed expenses for the specified month
    fixed_expense_entries = get_all_fixed_expense_entries_by_month(month)
    total_fixed_expenses = sum(entry["amount"] for entry in fixed_expense_entries)

    # Get total actual expenses for the specified month
    actual_expense_entries = get_all_actual_expense_entries_by_month(month)
    total_actual_expenses = sum(entry["amount"] for entry in actual_expense_entries)

    # Calculate total expenses
    total_expenses = total_fixed_expenses + total_actual_expenses

    # Calculate available cash
    available_cash = total_income - total_expenses

    return {
        "available_cash": available_cash,
        "total_income": total_income,
        "total_fixed_expenses": total_fixed_expenses,
        "total_actual_expenses": total_actual_expenses,
        "total_expenses": total_expenses,
        "month": month,
    }
