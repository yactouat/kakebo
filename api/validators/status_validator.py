from exceptions import ValidationError


VALID_PROJECT_STATUSES = ["Active", "Paused", "Completed", "Cancelled"]


def validate_project_status(status: str) -> str:
    """Validate that status is one of the allowed values."""
    if status not in VALID_PROJECT_STATUSES:
        raise ValidationError(
            f"Invalid status '{status}'. Must be one of: {', '.join(VALID_PROJECT_STATUSES)}"
        )
    return status
