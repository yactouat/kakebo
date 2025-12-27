from pydantic import BaseModel, field_validator
from validators.no_null_validator import create_no_null_validator


def validate_amount(v):
    """Validates that amount is >= 0 if provided."""
    if v is not None and v < 0:
        raise ValueError("Amount must be >= 0")
    return v


class DebtEntryCreate(BaseModel):
    name: str
    initial_amount: float
    current_balance: float
    currency: str = "EUR"
    linked_fixed_expense_id: int | None = None
    notes: str | None = None

    validate_no_null_values = create_no_null_validator(["name", "initial_amount", "current_balance"])
    validate_initial_amount = field_validator("initial_amount")(validate_amount)
    validate_current_balance = field_validator("current_balance")(validate_amount)


class DebtEntry(BaseModel):
    id: int
    name: str
    initial_amount: float
    current_balance: float
    currency: str = "EUR"
    linked_fixed_expense_id: int | None = None
    notes: str | None = None
    created_at: str


class DebtEntryUpdate(BaseModel):
    name: str | None = None
    initial_amount: float | None = None
    current_balance: float | None = None
    currency: str | None = None
    linked_fixed_expense_id: int | None = None
    notes: str | None = None

    validate_no_null_values = create_no_null_validator(
        ["name", "initial_amount", "current_balance", "currency"]
    )
    validate_initial_amount = field_validator("initial_amount")(validate_amount)
    validate_current_balance = field_validator("current_balance")(validate_amount)

