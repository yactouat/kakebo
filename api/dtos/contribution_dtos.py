from pydantic import BaseModel, field_validator

from validators.amount_validator import validate_amount
from validators.no_null_validator import create_no_null_validator


class ContributionCreate(BaseModel):
    project_id: int
    amount: float
    date: str
    notes: str | None = None

    validate_no_null_values = create_no_null_validator(["project_id", "amount", "date"])
    validate_amount = field_validator("amount")(validate_amount)


class Contribution(ContributionCreate):
    id: int
    created_at: str

