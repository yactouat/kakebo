from pydantic import BaseModel, field_validator

from validators.amount_validator import validate_amount
from validators.no_null_validator import create_no_null_validator


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    target_amount: float
    status: str = "Active"
    savings_account_id: int | None = None
    currency: str = "EUR"

    validate_no_null_values = create_no_null_validator(["name", "target_amount", "currency", "status"])
    validate_target_amount = field_validator("target_amount")(validate_amount)


class Project(BaseModel):
    id: int
    name: str
    description: str | None = None
    target_amount: float
    status: str
    savings_account_id: int | None = None
    currency: str = "EUR"
    created_at: str
    updated_at: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    target_amount: float | None = None
    status: str | None = None
    savings_account_id: int | None = None
    currency: str | None = None

    validate_no_null_values = create_no_null_validator(["name", "target_amount", "currency", "status"])
    validate_target_amount = field_validator("target_amount")(validate_amount)
