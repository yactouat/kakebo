from datetime import datetime, timedelta
from typing import Optional


def extract_month_from_date(date_str: str) -> Optional[str]:
    """Extract month in YYYY-MM format from a date string.
    
    Args:
        date_str: Date string in YYYY-MM-DD format (or YYYY-MM)
    
    Returns:
        Month string in YYYY-MM format, or None if invalid
    """
    try:
        # Try to parse as YYYY-MM-DD or YYYY-MM
        if len(date_str) >= 7:
            return date_str[:7]  # Extract YYYY-MM
        return None
    except Exception:
        return None


def format_month_name_for_balance(month: str) -> str:
    """Format month string (YYYY-MM) into a balance entry name like "January 2026".
    
    Args:
        month: Month string in YYYY-MM format
    
    Returns:
        Formatted month name (e.g., "January 2026")
    """
    try:
        year_str, month_str = month.split('-')
        year = int(year_str)
        month_num = int(month_str)
        
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        if 1 <= month_num <= 12:
            return f"{month_names[month_num - 1]} {year} balance"
        return f"{month} balance"
    except Exception:
        return f"{month} balance"


def get_previous_month() -> str:
    """Get the previous month in YYYY-MM format.
    
    Returns:
        Previous month string in YYYY-MM format (e.g., "2026-01")
    """
    today = datetime.now()
    # Get first day of current month, then subtract one day to get last day of previous month
    first_day_current = today.replace(day=1)
    last_day_previous = first_day_current - timedelta(days=1)
    return last_day_previous.strftime("%Y-%m")


def is_previous_month(month: str) -> bool:
    """Check if a given month string is the previous month.
    
    Args:
        month: Month string in YYYY-MM format
    
    Returns:
        True if the month is the previous month, False otherwise
    """
    previous_month = get_previous_month()
    return month == previous_month

