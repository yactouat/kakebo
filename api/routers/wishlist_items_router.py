"""Router for wishlist items endpoints."""
from typing import List, Optional

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile
from pydantic import ValidationError as PydanticValidationError

from dtos.project import Project
from dtos.wishlist_item import (
    WishlistItem,
    WishlistItemBulkDelete,
    WishlistItemBulkPurchase,
    WishlistItemCreate,
    WishlistItemMove,
    WishlistItemUpdate,
)
from exceptions import ValidationError
from schemas import APIResponse
from services.wishlist_items_services import (
    bulk_delete_items,
    bulk_purchase_items,
    create_wishlist_item,
    delete_wishlist_item,
    export_item_to_project,
    get_all_wishlist_items,
    get_wishlist_item_by_id,
    move_items_to_wishlist,
    swap_wishlist_item_priority,
    update_wishlist_item,
)


router = APIRouter(prefix="/wishlist-items", tags=["wishlist-items"])


@router.post("/bulk/delete", response_model=APIResponse[dict])
async def bulk_delete_wishlist_items(entry: WishlistItemBulkDelete):
    """Delete multiple wishlist items."""
    try:
        count = bulk_delete_items(entry)
        return APIResponse(
            data={"deleted_count": count},
            msg=f"Deleted {count} wishlist item(s) successfully",
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete items: {str(e)}")


@router.post("/bulk/move", response_model=APIResponse[dict])
async def move_wishlist_items(entry: WishlistItemMove):
    """Move items to a different wishlist."""
    try:
        count = move_items_to_wishlist(entry)
        return APIResponse(
            data={"moved_count": count}, msg=f"Moved {count} item(s) successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move items: {str(e)}")


@router.post("/bulk/purchase", response_model=APIResponse[dict])
async def bulk_purchase_wishlist_items(entry: WishlistItemBulkPurchase):
    """Mark multiple items as purchased/unpurchased."""
    try:
        count = bulk_purchase_items(entry)
        status_text = "purchased" if entry.purchased else "unpurchased"
        return APIResponse(
            data={"updated_count": count},
            msg=f"Marked {count} item(s) as {status_text} successfully",
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update items: {str(e)}")


@router.post("", response_model=APIResponse[WishlistItem], status_code=201)
async def create_wishlist_item_entry(
    wishlist_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    currency: str = Form("EUR"),
    priority: int = Form(...),
    notes: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    uploaded_file: Optional[UploadFile] = File(None),
):
    """Create a new wishlist item with optional file upload."""
    try:
        entry = WishlistItemCreate(
            wishlist_id=wishlist_id,
            name=name,
            description=description,
            amount=amount,
            currency=currency,
            priority=priority,
            notes=notes,
            url=url,
        )
        created = await create_wishlist_item(entry, uploaded_file)
        return APIResponse(
            data=WishlistItem(**created), msg="Wishlist item created successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create wishlist item: {str(e)}"
        )


@router.delete("/{item_id}", response_model=APIResponse[dict])
async def delete_wishlist_item_entry(item_id: int):
    """Delete a wishlist item by ID."""
    deleted = delete_wishlist_item(item_id)
    if not deleted:
        raise HTTPException(
            status_code=404, detail=f"Wishlist item with id {item_id} not found"
        )
    return APIResponse(data=None, msg="Wishlist item deleted successfully")


@router.post("/{item_id}/export-to-project", response_model=APIResponse[Project])
async def export_to_project(item_id: int):
    """Export wishlist item to project and delete the item."""
    try:
        project = export_item_to_project(item_id)
        return APIResponse(
            data=Project(**project), msg="Item exported to project successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export item: {str(e)}")


@router.get("", response_model=APIResponse[List[WishlistItem]])
async def get_wishlist_items(
    wishlist_id: int = Query(..., description="Wishlist ID to filter by"),
    show_purchased: bool = Query(False, description="Include purchased items"),
):
    """Get all items for a wishlist."""
    try:
        items = get_all_wishlist_items(wishlist_id, show_purchased)
        return APIResponse(
            data=[WishlistItem(**item) for item in items],
            msg="Wishlist items retrieved successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve wishlist items: {str(e)}"
        )


@router.get("/{item_id}", response_model=APIResponse[WishlistItem])
async def get_wishlist_item(item_id: int):
    """Get a single wishlist item by ID."""
    item = get_wishlist_item_by_id(item_id)
    if item is None:
        raise HTTPException(
            status_code=404, detail=f"Wishlist item with id {item_id} not found"
        )
    return APIResponse(
        data=WishlistItem(**item), msg="Wishlist item retrieved successfully"
    )


@router.put("/{item_id}", response_model=APIResponse[WishlistItem])
async def update_wishlist_item_entry(
    item_id: int,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    currency: Optional[str] = Form(None),
    priority: Optional[int] = Form(None),
    notes: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    purchased: Optional[bool] = Form(None),
    uploaded_file: Optional[UploadFile] = File(None),
):
    """Update a wishlist item by ID."""
    existing = get_wishlist_item_by_id(item_id)
    if existing is None:
        raise HTTPException(
            status_code=404, detail=f"Wishlist item with id {item_id} not found"
        )

    try:
        entry_update = WishlistItemUpdate(
            name=name,
            description=description,
            amount=amount,
            currency=currency,
            priority=priority,
            notes=notes,
            url=url,
            purchased=purchased,
        )
        updated = await update_wishlist_item(item_id, entry_update, existing, uploaded_file)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update wishlist item")
        return APIResponse(
            data=WishlistItem(**updated), msg="Wishlist item updated successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update wishlist item: {str(e)}"
        )


@router.post("/{item_id}/swap-priority", response_model=APIResponse[WishlistItem])
async def swap_priority(item_id: int, direction: str = Query(..., description="Direction to move: 'up' or 'down'")):
    """Swap a wishlist item's priority with an adjacent item.
    
    Args:
        item_id: The ID of the item to move
        direction: Either 'up' (decrease priority) or 'down' (increase priority)
    """
    if direction not in ['up', 'down']:
        raise HTTPException(status_code=400, detail="Direction must be 'up' or 'down'")
    
    try:
        updated = swap_wishlist_item_priority(item_id, direction)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to swap priorities")
        return APIResponse(data=WishlistItem(**updated), msg="Priority swapped successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to swap priority: {str(e)}")
