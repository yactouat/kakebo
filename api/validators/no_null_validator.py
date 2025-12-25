from pydantic import model_validator


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

