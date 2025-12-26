from pydantic import BaseModel
from enum import Enum

from validators.no_null_validator import create_no_null_validator


class ExpenseCategory(str, Enum):
    ESSENTIAL = "essential"
    COMFORT = "comfort"
    ENTERTAINMENT_AND_LEISURE = "entertainment and leisure"
    EXTRAS = "extras"
    UNFORESEEN = "unforeseen"


class ActualExpenseEntryCreate(BaseModel):
    amount: float
    date: str
    item: str
    category: ExpenseCategory
    currency: str = "EUR"

    validate_no_null_values = create_no_null_validator(["amount", "date", "item", "category"])


class ActualExpenseEntry(BaseModel):
    id: int
    amount: float
    date: str
    item: str
    category: ExpenseCategory
    currency: str = "EUR"


class ActualExpenseEntryUpdate(BaseModel):
    amount: float | None = None
    date: str | None = None
    item: str | None = None
    category: ExpenseCategory | None = None
    currency: str | None = None

    validate_no_null_values = create_no_null_validator(
        ["amount", "date", "item", "category", "currency"]
    )


class BulkActualExpenseEntryDeleteRequest(BaseModel):
    entry_ids: list[int]


class BulkActualExpenseEntryUpdateRequest(BaseModel):
    entry_ids: list[int]
    update: ActualExpenseEntryUpdate


class BulkActualExpenseEntryMergeRequest(BaseModel):
    entry_ids: list[int]

