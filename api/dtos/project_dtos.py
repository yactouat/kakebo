from pydantic import BaseModel, field_validator
from validators.no_null_validator import create_no_null_validator


def validate_amount(v):
    """Validates that amount is >= 0 if provided."""
    if v is not None and v < 0:
        raise ValueError("Amount must be >= 0")
    return v


def validate_priority(v):
    """Validates that priority is one of the allowed values if provided."""
    if v is not None and v not in ['high', 'medium', 'low']:
        raise ValueError("Priority must be one of: 'high', 'medium', 'low'")
    return v


def validate_status(v):
    """Validates that status is one of the allowed values if provided."""
    if v is not None and v not in ['active', 'completed']:
        raise ValueError("Status must be one of: 'active', 'completed'")
    return v


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    target_amount: float
    target_date: str
    priority: str
    category: str | None = None
    status: str = "active"
    savings_account_name: str
    currency: str = "EUR"

    validate_no_null_values = create_no_null_validator(
        ["name", "target_amount", "target_date", "priority", "savings_account_name"]
    )
    validate_target_amount = field_validator("target_amount")(validate_amount)
    validate_priority = field_validator("priority")(validate_priority)
    validate_status = field_validator("status")(validate_status)


class Project(ProjectCreate):
    id: int
    created_at: str
    updated_at: str


class ProjectResponse(Project):
    current_savings: float
    progress_percentage: float


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: float | None = None
    target_date: str | None = None
    priority: str | None = None
    category: str | None = None
    status: str | None = None
    savings_account_name: str | None = None
    currency: str | None = None

    validate_no_null_values = create_no_null_validator(
        ["name", "target_amount", "target_date", "priority", "savings_account_name", "status", "currency"]
    )
    validate_target_amount = field_validator("target_amount")(validate_amount)
    validate_priority = field_validator("priority")(validate_priority)
    validate_status = field_validator("status")(validate_status)

