"""Router for wishlists endpoints."""
from typing import List

from fastapi import APIRouter, HTTPException, Query
from pydantic import ValidationError as PydanticValidationError

from dtos.wishlist import Wishlist, WishlistCreate, WishlistUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.wishlists_services import (
    create_wishlist,
    delete_wishlist,
    get_all_wishlists,
    get_wishlist_by_id,
    update_wishlist,
)


router = APIRouter(prefix="/wishlists", tags=["wishlists"])


@router.post("", response_model=APIResponse[Wishlist], status_code=201)
async def create_wishlist_entry(entry: WishlistCreate):
    """Create a new wishlist."""
    try:
        created = create_wishlist(entry)
        return APIResponse(
            data=Wishlist(**created), msg="Wishlist created successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create wishlist: {str(e)}"
        )


@router.delete("/{wishlist_id}", response_model=APIResponse[dict])
async def delete_wishlist_entry(wishlist_id: int):
    """Delete a wishlist by ID (cascades to items)."""
    deleted = delete_wishlist(wishlist_id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail=f"Wishlist with id {wishlist_id} not found"
        )
    return APIResponse(data=None, msg="Wishlist deleted successfully")


@router.get("", response_model=APIResponse[List[Wishlist]])
async def get_all_wishlists_filtered(
    search: str | None = Query(None, description="Search in name/description")
):
    """Get all wishlists with optional search filter."""
    try:
        wishlists = get_all_wishlists(search=search)
        return APIResponse(
            data=[Wishlist(**w) for w in wishlists],
            msg="Wishlists retrieved successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve wishlists: {str(e)}"
        )


@router.get("/{wishlist_id}", response_model=APIResponse[Wishlist])
async def get_wishlist(wishlist_id: int):
    """Get a single wishlist by ID."""
    wishlist = get_wishlist_by_id(wishlist_id)
    if wishlist is None:
        raise HTTPException(
            status_code=404, detail=f"Wishlist with id {wishlist_id} not found"
        )
    return APIResponse(data=Wishlist(**wishlist), msg="Wishlist retrieved successfully")


@router.put("/{wishlist_id}", response_model=APIResponse[Wishlist])
async def update_wishlist_entry(wishlist_id: int, entry_update: WishlistUpdate):
    """Update a wishlist by ID."""
    existing = get_wishlist_by_id(wishlist_id)
    if existing is None:
        raise HTTPException(
            status_code=404, detail=f"Wishlist with id {wishlist_id} not found"
        )

    try:
        updated = update_wishlist(wishlist_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update wishlist")
        return APIResponse(
            data=Wishlist(**updated), msg="Wishlist updated successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update wishlist: {str(e)}"
        )
