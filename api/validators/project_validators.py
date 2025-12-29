from datetime import datetime
from typing import Optional
from exceptions import ValidationError
import re


def validate_priority(priority: str) -> None:
    """Validate that priority is one of the allowed values.
    
    Args:
        priority: Priority string to validate
    
    Raises:
        ValueError: If priority is not one of ['high', 'medium', 'low']
    """
    if priority not in ['high', 'medium', 'low']:
        raise ValueError("Priority must be one of: 'high', 'medium', 'low'")


def validate_status(status: str) -> None:
    """Validate that status is one of the allowed values.
    
    Args:
        status: Status string to validate
    
    Raises:
        ValueError: If status is not one of ['active', 'completed']
    """
    if status not in ['active', 'completed']:
        raise ValueError("Status must be one of: 'active', 'completed'")


def validate_target_date(date_str: str) -> None:
    """Validate that target_date is in YYYY-MM-DD format and not in the past.
    
    Args:
        date_str: Date string to validate (e.g., "2026-12-31")
    
    Raises:
        ValueError: If date format is invalid or date is in the past
    """
    # Validate date format: YYYY-MM-DD
    date_pattern = re.compile(r'^\d{4}-\d{2}-\d{2}$')
    if not date_pattern.match(date_str):
        raise ValueError(f"Invalid date format. Expected YYYY-MM-DD (e.g., '2026-12-31'), got '{date_str}'")
    
    # Parse and validate the date
    try:
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        today = datetime.now().date()
        
        if target_date < today:
            raise ValueError(f"Target date cannot be in the past. Got '{date_str}'")
    except ValueError as e:
        # Re-raise ValueError from strptime or our validation
        if "Invalid date format" in str(e) or "Target date cannot be in the past" in str(e):
            raise
        raise ValueError(f"Invalid date format. Expected YYYY-MM-DD (e.g., '2026-12-31'), got '{date_str}'")


def validate_unique_savings_account(conn, account_name: str, exclude_project_id: Optional[int] = None) -> None:
    """Validate that savings_account_name is not empty.
    
    Note: Multiple projects can share the same savings account name.
    This function only validates that the account name is provided.
    
    Args:
        conn: Database connection (kept for API compatibility, not used)
        account_name: Savings account name to validate
        exclude_project_id: Optional project ID (kept for API compatibility, not used)
    
    Raises:
        ValueError: If savings_account_name is empty
    """
    if not account_name or not account_name.strip():
        raise ValueError("Savings account name cannot be empty")

