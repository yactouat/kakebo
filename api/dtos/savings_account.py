from pydantic import BaseModel, field_validator

from validators.amount_validator import validate_amount
from validators.no_null_validator import create_no_null_validator


class SavingsAccountCreate(BaseModel):
    name: str
    initial_balance: float = 0.0
    currency: str = "EUR"
    bank_institution: str | None = None

    validate_initial_balance = field_validator("initial_balance")(validate_amount)
    validate_no_null_values = create_no_null_validator(["name", "initial_balance", "currency"])


class SavingsAccount(BaseModel):
    id: int
    name: str
    initial_balance: float
    currency: str = "EUR"
    bank_institution: str | None = None
    created_at: str
    updated_at: str | None = None


class SavingsAccountUpdate(BaseModel):
    name: str | None = None
    initial_balance: float | None = None
    currency: str | None = None
    bank_institution: str | None = None

    validate_initial_balance = field_validator("initial_balance")(validate_amount)
    validate_no_null_values = create_no_null_validator(["name", "initial_balance", "currency"])
