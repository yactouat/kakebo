from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.actual_expense_entry import (
    ActualExpenseEntry,
    ActualExpenseEntryCreate,
    ActualExpenseEntryUpdate,
    BulkActualExpenseEntryDeleteRequest,
    BulkActualExpenseEntryMergeRequest,
    BulkActualExpenseEntryUpdateRequest,
)
from exceptions import ValidationError
from schemas import APIResponse
from services.actual_expense_entries_services import (
    bulk_delete_actual_expense_entries,
    bulk_update_actual_expense_entries,
    create_actual_expense_entry,
    delete_actual_expense_entry,
    get_all_actual_expense_entries_by_month,
    get_actual_expense_entry_by_id,
    merge_actual_expense_entries,
    update_actual_expense_entry,
)


router = APIRouter(prefix="/actual-expense-entries", tags=["actual-expense-entries"])


# CRUD endpoints for actual_expense_entries
@router.post("", response_model=APIResponse[ActualExpenseEntry], status_code=201)
async def create_entry(entry: ActualExpenseEntryCreate):
    """Create a new actual expense entry.
    
    The ActualExpenseEntryCreate DTO is automatically validated by Pydantic,
    ensuring all required fields are present and not None.
    """
    try:
        # The entry DTO is already validated by FastAPI/Pydantic
        created = create_actual_expense_entry(entry)
        return APIResponse(data=ActualExpenseEntry(**created), msg="Actual expense entry created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create actual expense entry: {str(e)}")


@router.get("", response_model=APIResponse[List[ActualExpenseEntry]])
async def get_all_entries_by_month(month: str):
    """Get all actual expense entries for a specific month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2024-01" for January 2024)
    """
    try:
        entries = get_all_actual_expense_entries_by_month(month)
        return APIResponse(
            data=[ActualExpenseEntry(**entry) for entry in entries],
            msg="Actual expense entries retrieved successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve actual expense entries: {str(e)}")


@router.get("/{entry_id}", response_model=APIResponse[ActualExpenseEntry])
async def get_entry(entry_id: int):
    """Get a single actual expense entry by ID."""
    entry = get_actual_expense_entry_by_id(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Actual expense entry with id {entry_id} not found")
    return APIResponse(data=ActualExpenseEntry(**entry), msg="Actual expense entry retrieved successfully")


@router.put("/{entry_id}", response_model=APIResponse[ActualExpenseEntry])
async def update_entry(entry_id: int, entry_update: ActualExpenseEntryUpdate):
    """Update an actual expense entry by ID.
    
    The ActualExpenseEntryUpdate DTO is automatically validated by Pydantic,
    ensuring that if fields are provided, they cannot be None (via model_validator).
    """
    # Get existing entry to fill in missing fields
    existing = get_actual_expense_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Actual expense entry with id {entry_id} not found")
    
    # The entry_update DTO is already validated by FastAPI/Pydantic
    # The model_validator ensures no None values if fields are provided
    try:
        updated = update_actual_expense_entry(entry_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update actual expense entry")
        return APIResponse(data=ActualExpenseEntry(**updated), msg="Actual expense entry updated successfully")
    except HTTPException:
        raise
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update actual expense entry: {str(e)}")


@router.delete("/bulk", response_model=APIResponse[dict])
async def bulk_delete_entries(request: BulkActualExpenseEntryDeleteRequest):
    """Delete multiple actual expense entries by IDs."""
    if not request.entry_ids:
        raise HTTPException(status_code=400, detail="No entry IDs provided")

    deleted_count = bulk_delete_actual_expense_entries(request.entry_ids)

    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="No entries found with provided IDs")

    return APIResponse(
        data={"deleted_count": deleted_count},
        msg=f"Successfully deleted {deleted_count} actual expense entr{'y' if deleted_count == 1 else 'ies'}"
    )


@router.put("/bulk", response_model=APIResponse[dict])
async def bulk_update_entries(request: BulkActualExpenseEntryUpdateRequest):
    """Update multiple actual expense entries with the same update data."""
    if not request.entry_ids:
        raise HTTPException(status_code=400, detail="No entry IDs provided")
    
    try:
        updated_count = bulk_update_actual_expense_entries(request.entry_ids, request.update)

        if updated_count == 0:
            raise HTTPException(status_code=404, detail="No entries found with provided IDs")

        return APIResponse(
            data={"updated_count": updated_count},
            msg=f"Successfully updated {updated_count} actual expense entr{'y' if updated_count == 1 else 'ies'}"
        )
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update actual expense entries: {str(e)}")


@router.post("/merge", response_model=APIResponse[ActualExpenseEntry])
async def merge_entries(request: BulkActualExpenseEntryMergeRequest):
    """Merge multiple actual expense entries into one.
    
    Merges entries by summing amounts, combining items, using most recent date,
    first entry's category and currency. Original entries are deleted.
    """
    if not request.entry_ids or len(request.entry_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 entry IDs are required to merge")
    
    try:
        merged_entry = merge_actual_expense_entries(request.entry_ids)
        return APIResponse(
            data=ActualExpenseEntry(**merged_entry),
            msg=f"Successfully merged {len(request.entry_ids)} actual expense entr{'y' if len(request.entry_ids) == 1 else 'ies'}"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to merge actual expense entries: {str(e)}")


@router.delete("/{entry_id}", response_model=APIResponse[dict])
async def delete_entry(entry_id: int):
    """Delete an actual expense entry by ID."""
    deleted = delete_actual_expense_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Actual expense entry with id {entry_id} not found")
    return APIResponse(data=None, msg="Actual expense entry deleted successfully")

