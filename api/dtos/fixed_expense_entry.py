from pydantic import BaseModel

from validators.no_null_validator import create_no_null_validator


class FixedExpenseEntryCreate(BaseModel):
    amount: float
    item: str
    currency: str = 'EUR'

    validate_no_null_values = create_no_null_validator(['amount', 'item'])


class FixedExpenseEntry(BaseModel):
    id: int
    amount: float
    item: str
    currency: str = 'EUR'


class FixedExpenseEntryUpdate(BaseModel):
    amount: float | None = None
    item: str | None = None
    currency: str | None = None

    validate_no_null_values = create_no_null_validator(['amount', 'item', 'currency'])

