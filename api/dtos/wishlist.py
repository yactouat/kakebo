"""DTOs for wishlists."""
from pydantic import BaseModel, field_validator

from validators.no_null_validator import create_no_null_validator


class WishlistCreate(BaseModel):
    """DTO for creating a new wishlist."""

    name: str
    description: str | None = None

    validate_no_null_values = create_no_null_validator(["name"])

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate name is not empty and within max length."""
        if not v or not v.strip():
            raise ValueError("Name is required")
        v = v.strip()
        if len(v) > 200:
            raise ValueError("Name must be less than 200 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        """Validate description within max length."""
        if v is not None:
            v = v.strip() if v.strip() else None
            if v and len(v) > 1000:
                raise ValueError("Description must be less than 1000 characters")
        return v


class Wishlist(BaseModel):
    """DTO for returning a wishlist."""

    id: int
    name: str
    description: str | None = None
    created_at: str
    updated_at: str | None = None
    item_count: int = 0


class WishlistUpdate(BaseModel):
    """DTO for updating a wishlist."""

    name: str | None = None
    description: str | None = None

    validate_no_null_values = create_no_null_validator(["name"])

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        """Validate name is not empty and within max length."""
        if v is not None:
            if not v.strip():
                raise ValueError("Name cannot be empty")
            v = v.strip()
            if len(v) > 200:
                raise ValueError("Name must be less than 200 characters")
        return v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str | None) -> str | None:
        """Validate description within max length."""
        if v is not None:
            v = v.strip() if v.strip() else None
            if v and len(v) > 1000:
                raise ValueError("Description must be less than 1000 characters")
        return v
