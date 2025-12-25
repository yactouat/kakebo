from pydantic import BaseModel, model_validator


def create_no_null_validator(field_names: list[str]):
    """Create a validator that ensures provided fields cannot be None."""
    @model_validator(mode='before')
    def validate_no_null_values(cls, data):
        """Ensure that if fields are provided, they cannot be None."""
        if isinstance(data, dict):
            for field_name in field_names:
                if field_name in data and data[field_name] is None:
                    raise ValueError(f"{field_name} cannot be None")
        return data
    return validate_no_null_values


class IncomeEntryCreate(BaseModel):
    amount: float
    date: str
    item: str

    validate_no_null_values = create_no_null_validator(['amount', 'date', 'item'])


class IncomeEntry(BaseModel):
    id: int
    amount: float
    date: str
    item: str


class IncomeEntryUpdate(BaseModel):
    amount: float
    date: str
    item: str

    validate_no_null_values = create_no_null_validator(['amount', 'date', 'item'])

