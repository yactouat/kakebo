"""DTOs for wishlist items."""
from pydantic import BaseModel, field_validator

from validators.amount_validator import validate_amount
from validators.no_null_validator import create_no_null_validator
from validators.url_validator import validate_url


class WishlistItemCreate(BaseModel):
    """DTO for creating a new wishlist item."""

    wishlist_id: int
    name: str
    description: str | None = None
    amount: float | None = None
    currency: str = "EUR"
    priority: int
    notes: str | None = None
    url: str | None = None

    validate_no_null_values = create_no_null_validator(
        ["wishlist_id", "name", "currency", "priority"]
    )
    validate_amount_value = field_validator("amount")(validate_amount)
    validate_url_value = field_validator("url")(validate_url)

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

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: str | None) -> str | None:
        """Validate notes within max length."""
        if v is not None:
            v = v.strip() if v.strip() else None
            if v and len(v) > 2000:
                raise ValueError("Notes must be less than 2000 characters")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: int) -> int:
        """Validate priority is a positive integer."""
        if v <= 0 or not isinstance(v, int):
            raise ValueError("Priority must be a positive integer")
        return v


class WishlistItem(BaseModel):
    """DTO for returning a wishlist item."""

    id: int
    wishlist_id: int
    name: str
    description: str | None = None
    amount: float | None = None
    currency: str = "EUR"
    priority: int
    notes: str | None = None
    url: str | None = None
    url_preview_image: str | None = None
    uploaded_image: str | None = None
    purchased: bool = False
    purchased_at: str | None = None
    created_at: str
    updated_at: str | None = None


class WishlistItemUpdate(BaseModel):
    """DTO for updating a wishlist item."""

    name: str | None = None
    description: str | None = None
    amount: float | None = None
    currency: str | None = None
    priority: int | None = None
    notes: str | None = None
    url: str | None = None
    purchased: bool | None = None

    validate_no_null_values = create_no_null_validator(["name", "currency"])
    validate_amount_value = field_validator("amount")(validate_amount)
    validate_url_value = field_validator("url")(validate_url)

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

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: str | None) -> str | None:
        """Validate notes within max length."""
        if v is not None:
            v = v.strip() if v.strip() else None
            if v and len(v) > 2000:
                raise ValueError("Notes must be less than 2000 characters")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: int | None) -> int | None:
        """Validate priority is a positive integer if provided."""
        if v is not None:
            if v <= 0 or not isinstance(v, int):
                raise ValueError("Priority must be a positive integer")
        return v


class WishlistItemBulkDelete(BaseModel):
    """DTO for bulk deleting wishlist items."""

    item_ids: list[int]

    @field_validator("item_ids")
    @classmethod
    def validate_item_ids(cls, v: list[int]) -> list[int]:
        """Validate at least one item ID provided."""
        if not v or len(v) == 0:
            raise ValueError("At least one item ID required")
        return v


class WishlistItemBulkPurchase(BaseModel):
    """DTO for bulk marking items as purchased/unpurchased."""

    item_ids: list[int]
    purchased: bool

    validate_no_null_values = create_no_null_validator(["purchased"])

    @field_validator("item_ids")
    @classmethod
    def validate_item_ids(cls, v: list[int]) -> list[int]:
        """Validate at least one item ID provided."""
        if not v or len(v) == 0:
            raise ValueError("At least one item ID required")
        return v


class WishlistItemMove(BaseModel):
    """DTO for moving items to a different wishlist."""

    item_ids: list[int]
    target_wishlist_id: int

    validate_no_null_values = create_no_null_validator(["target_wishlist_id"])

    @field_validator("item_ids")
    @classmethod
    def validate_item_ids(cls, v: list[int]) -> list[int]:
        """Validate at least one item ID provided."""
        if not v or len(v) == 0:
            raise ValueError("At least one item ID required")
        return v


