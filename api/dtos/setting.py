"""DTOs for settings."""
from pydantic import BaseModel, field_validator

from validators.no_null_validator import create_no_null_validator


class Setting(BaseModel):
    """DTO for returning a setting."""

    id: int
    key: str
    value: str
    created_at: str
    updated_at: str | None = None


class SettingUpdate(BaseModel):
    """DTO for updating a setting."""

    value: str

    validate_no_null_values = create_no_null_validator(["value"])

    @field_validator("value")
    @classmethod
    def validate_value(cls, v: str) -> str:
        """Validate value is not empty."""
        if v is None or v.strip() == "":
            raise ValueError("Value cannot be empty")
        return v.strip()
