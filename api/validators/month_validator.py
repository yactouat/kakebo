from exceptions import ValidationError
import re

def validate_month_format(month: str) -> None:
    """Validate that a month string is in YYYY-MM format.
    
    Args:
        month: Month string to validate (e.g., "2026-01")
    
    Raises:
        ValidationError: If the month format is invalid or month number is out of range
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

