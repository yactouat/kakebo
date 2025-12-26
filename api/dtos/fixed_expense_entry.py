from pydantic import BaseModel, field_validator
from validators.no_null_validator import create_no_null_validator


def validate_month(v):
    """Validates that month is between 1 and 12 if provided."""
    if v is not None and (v < 1 or v > 12):
        raise ValueError("Month must be between 1 and 12")
    return v


def validate_year(v):
    """Validates that year is positive if provided."""
    if v is not None and v < 1:
        raise ValueError("Year must be positive")
    return v


class FixedExpenseEntryCreate(BaseModel):
    amount: float
    item: str
    currency: str = "EUR"
    month: int | None = None
    year: int | None = None

    validate_no_null_values = create_no_null_validator(["amount", "item"])
    validate_month = field_validator("month")(validate_month)
    validate_year = field_validator("year")(validate_year)


class FixedExpenseEntry(BaseModel):
    id: int
    amount: float
    item: str
    currency: str = "EUR"
    month: int
    year: int


class FixedExpenseEntryUpdate(BaseModel):
    amount: float | None = None
    item: str | None = None
    currency: str | None = None
    month: int | None = None
    year: int | None = None

    validate_month = field_validator("month")(validate_month)
    validate_year = field_validator("year")(validate_year)

    validate_no_null_values = create_no_null_validator(
        ["amount", "item", "currency", "month", "year"]
    )


class BulkFixedExpenseEntryDeleteRequest(BaseModel):
    entry_ids: list[int]


class BulkFixedExpenseEntryUpdateRequest(BaseModel):
    entry_ids: list[int]
    update: FixedExpenseEntryUpdate


class BulkFixedExpenseEntryMergeRequest(BaseModel):
    entry_ids: list[int]
