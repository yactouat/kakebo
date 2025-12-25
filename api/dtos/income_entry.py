from pydantic import BaseModel

from validators.no_null_validator import create_no_null_validator


class IncomeEntryCreate(BaseModel):
    amount: float
    date: str
    item: str
    currency: str = 'EUR'

    validate_no_null_values = create_no_null_validator(['amount', 'date', 'item'])


class IncomeEntry(BaseModel):
    id: int
    amount: float
    date: str
    item: str
    currency: str = 'EUR'


class IncomeEntryUpdate(BaseModel):
    amount: float | None = None
    date: str | None = None
    item: str | None = None
    currency: str | None = None

    validate_no_null_values = create_no_null_validator(['amount', 'date', 'item', 'currency'])

