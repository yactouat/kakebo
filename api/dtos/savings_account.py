from pydantic import BaseModel, field_validator

from validators.amount_validator import validate_amount
from validators.no_null_validator import create_no_null_validator


class SavingsAccountCreate(BaseModel):
    """DTO for creating a savings account."""

    name: str
    base_balance: float = 0.0
    """Snapshot of your real-world account balance when you first add the account to the app. Track all future changes via contributions. Must be >= 0."""
    currency: str = "EUR"
    bank_institution: str | None = None

    validate_base_balance = field_validator("base_balance")(validate_amount)
    validate_no_null_values = create_no_null_validator(["name", "base_balance", "currency"])


class SavingsAccount(BaseModel):
    """Savings account response model."""

    id: int
    name: str
    base_balance: float
    """Snapshot of your real-world account balance when you first added the account. Current balance = base_balance + SUM(contributions)."""
    currency: str = "EUR"
    bank_institution: str | None = None
    created_at: str
    updated_at: str | None = None


class SavingsAccountUpdate(BaseModel):
    """DTO for updating a savings account."""

    name: str | None = None
    base_balance: float | None = None
    """Snapshot of your real-world account balance when you first added the account. Must be >= 0."""
    currency: str | None = None
    bank_institution: str | None = None

    validate_base_balance = field_validator("base_balance")(validate_amount)
    validate_no_null_values = create_no_null_validator(["name", "base_balance", "currency"])
