from pydantic import BaseModel, field_validator

from validators.amount_validator import validate_amount
from validators.no_null_validator import create_no_null_validator


class ContributionCreate(BaseModel):
    savings_account_id: int
    amount: float
    date: str  # YYYY-MM-DD
    notes: str | None = None

    validate_amount = field_validator("amount")(validate_amount)
    validate_no_null_values = create_no_null_validator(["savings_account_id", "amount", "date"])


class Contribution(BaseModel):
    id: int
    savings_account_id: int
    amount: float
    date: str
    notes: str | None = None
    created_at: str
    updated_at: str | None = None


class ContributionUpdate(BaseModel):
    savings_account_id: int | None = None
    amount: float | None = None
    date: str | None = None
    notes: str | None = None

    validate_amount = field_validator("amount")(validate_amount)
    validate_no_null_values = create_no_null_validator(["savings_account_id", "amount", "date"])
