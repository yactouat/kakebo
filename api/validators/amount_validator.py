def validate_amount(v):
    """Validates that amount is >= 0 if provided."""
    if v is not None and v < 0:
        raise ValueError("Amount must be >= 0")
    return v

