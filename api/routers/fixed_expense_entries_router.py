from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.fixed_expense_entry import (
    BulkFixedExpenseEntryDeleteRequest,
    BulkFixedExpenseEntryMergeRequest,
    BulkFixedExpenseEntryUpdateRequest,
    FixedExpenseEntry,
    FixedExpenseEntryCreate,
    FixedExpenseEntryUpdate,
)
from exceptions import ValidationError
from schemas import APIResponse
from services.balance_entry_services import update_balance_entry_for_month
from services.fixed_expense_entries_services import (
    bulk_delete_fixed_expense_entries,
    bulk_update_fixed_expense_entries,
    copy_fixed_expense_entries_to_next_month,
    create_fixed_expense_entry,
    delete_fixed_expense_entry,
    get_all_fixed_expense_entries_by_month,
    get_fixed_expense_entry_by_id,
    merge_fixed_expense_entries,
    update_fixed_expense_entry,
)
from utils.month_utils import is_previous_month


router = APIRouter(prefix="/fixed-expense-entries", tags=["fixed-expense-entries"])


# CRUD endpoints for fixed_expense_entries
@router.post("", response_model=APIResponse[FixedExpenseEntry], status_code=201)
async def create_entry(entry: FixedExpenseEntryCreate):
    """Create a new fixed expense entry.
    
    The FixedExpenseEntryCreate DTO is automatically validated by Pydantic,
    ensuring all required fields are present and not None.
    """
    try:
        # The entry DTO is already validated by FastAPI/Pydantic
        created = create_fixed_expense_entry(entry)
        
        # Check if this is month -1 and update balance if needed
        month_str = f"{created['year']}-{created['month']:02d}"
        if is_previous_month(month_str):
            update_balance_entry_for_month(month_str)
        
        return APIResponse(data=FixedExpenseEntry(**created), msg="Fixed expense entry created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create fixed expense entry: {str(e)}")


@router.post("/copy-to-next-month", response_model=APIResponse[dict])
async def copy_entries_to_next_month():
    """Copy all fixed expense entries from current month to next month.
    
    This endpoint can only be called when viewing the current month.
    It copies all fixed expense entries from the current month to the next month.
    """
    try:
        copied_count = copy_fixed_expense_entries_to_next_month()
        return APIResponse(
            data={"copied_count": copied_count},
            msg=f"Successfully copied {copied_count} fixed expense entr{'y' if copied_count == 1 else 'ies'} to next month"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to copy fixed expense entries: {str(e)}")


@router.get("", response_model=APIResponse[List[FixedExpenseEntry]])
async def get_all_entries_by_month(month: str):
    """Get all fixed expense entries for a specific month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2024-01" for January 2024)
    """
    try:
        entries = get_all_fixed_expense_entries_by_month(month)
        return APIResponse(
            data=[FixedExpenseEntry(**entry) for entry in entries],
            msg="Fixed expense entries retrieved successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve fixed expense entries: {str(e)}")


@router.get("/{entry_id}", response_model=APIResponse[FixedExpenseEntry])
async def get_entry(entry_id: int):
    """Get a single fixed expense entry by ID."""
    entry = get_fixed_expense_entry_by_id(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Fixed expense entry with id {entry_id} not found")
    return APIResponse(data=FixedExpenseEntry(**entry), msg="Fixed expense entry retrieved successfully")


@router.put("/{entry_id}", response_model=APIResponse[FixedExpenseEntry])
async def update_entry(entry_id: int, entry_update: FixedExpenseEntryUpdate):
    """Update a fixed expense entry by ID.
    
    The FixedExpenseEntryUpdate DTO is automatically validated by Pydantic,
    ensuring that if fields are provided, they cannot be None (via model_validator).
    """
    # Get existing entry to fill in missing fields
    existing = get_fixed_expense_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Fixed expense entry with id {entry_id} not found")
    
    # The entry_update DTO is already validated by FastAPI/Pydantic
    # The model_validator ensures no None values if fields are provided
    try:
        updated = update_fixed_expense_entry(entry_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update fixed expense entry")
        
        # Check if this is month -1 and update balance if needed
        # Use updated month/year if provided, otherwise use existing
        year_to_check = entry_update.year if entry_update.year is not None else existing["year"]
        month_to_check = entry_update.month if entry_update.month is not None else existing["month"]
        month_str = f"{year_to_check}-{month_to_check:02d}"
        if is_previous_month(month_str):
            update_balance_entry_for_month(month_str)
        
        return APIResponse(data=FixedExpenseEntry(**updated), msg="Fixed expense entry updated successfully")
    except HTTPException:
        raise
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update fixed expense entry: {str(e)}")


@router.delete("/bulk", response_model=APIResponse[dict])
async def bulk_delete_entries(request: BulkFixedExpenseEntryDeleteRequest):
    """Delete multiple fixed expense entries by IDs."""
    if not request.entry_ids:
        raise HTTPException(status_code=400, detail="No entry IDs provided")
    
    # Get existing entries to check months before deletion
    existing_entries = []
    for entry_id in request.entry_ids:
        existing = get_fixed_expense_entry_by_id(entry_id)
        if existing:
            existing_entries.append(existing)
    
    if not existing_entries:
        raise HTTPException(status_code=404, detail="No entries found with provided IDs")
    
    deleted_count = bulk_delete_fixed_expense_entries(request.entry_ids)
    
    # Check if any were month -1 and update balance if needed
    months_to_update = set()
    for existing in existing_entries:
        month_str = f"{existing['year']}-{existing['month']:02d}"
        if is_previous_month(month_str):
            months_to_update.add(month_str)
    
    for month in months_to_update:
        update_balance_entry_for_month(month)
    
    return APIResponse(
        data={"deleted_count": deleted_count},
        msg=f"Successfully deleted {deleted_count} fixed expense entr{'y' if deleted_count == 1 else 'ies'}"
    )


@router.put("/bulk", response_model=APIResponse[dict])
async def bulk_update_entries(request: BulkFixedExpenseEntryUpdateRequest):
    """Update multiple fixed expense entries with the same update data."""
    if not request.entry_ids:
        raise HTTPException(status_code=400, detail="No entry IDs provided")
    
    try:
        updated_count = bulk_update_fixed_expense_entries(request.entry_ids, request.update)
        
        if updated_count == 0:
            raise HTTPException(status_code=404, detail="No entries found with provided IDs")
        
        # Check if any were month -1 and update balance if needed
        # Get existing entries to check months
        months_to_update = set()
        for entry_id in request.entry_ids:
            existing = get_fixed_expense_entry_by_id(entry_id)
            if existing:
                year_to_check = request.update.year if request.update.year is not None else existing["year"]
                month_to_check = request.update.month if request.update.month is not None else existing["month"]
                month_str = f"{year_to_check}-{month_to_check:02d}"
                if is_previous_month(month_str):
                    months_to_update.add(month_str)
        
        for month in months_to_update:
            update_balance_entry_for_month(month)
        
        return APIResponse(
            data={"updated_count": updated_count},
            msg=f"Successfully updated {updated_count} fixed expense entr{'y' if updated_count == 1 else 'ies'}"
        )
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update fixed expense entries: {str(e)}")


@router.post("/merge", response_model=APIResponse[FixedExpenseEntry])
async def merge_entries(request: BulkFixedExpenseEntryMergeRequest):
    """Merge multiple fixed expense entries into one.
    
    Merges entries by summing amounts, combining items, using most recent
    month/year and currency. Original entries are deleted.
    """
    if not request.entry_ids or len(request.entry_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 entry IDs are required to merge")
    
    try:
        # Get existing entries to check months before merge
        existing_entries = []
        for entry_id in request.entry_ids:
            existing = get_fixed_expense_entry_by_id(entry_id)
            if existing:
                existing_entries.append(existing)
        
        if not existing_entries:
            raise HTTPException(status_code=404, detail="No entries found with provided IDs")
        
        # Perform merge
        merged_entry = merge_fixed_expense_entries(request.entry_ids)
        
        # Check if any were month -1 and update balance if needed
        months_to_update = set()
        for existing in existing_entries:
            month_str = f"{existing['year']}-{existing['month']:02d}"
            if is_previous_month(month_str):
                months_to_update.add(month_str)
        
        # Also check the merged entry's month
        merged_month_str = f"{merged_entry['year']}-{merged_entry['month']:02d}"
        if is_previous_month(merged_month_str):
            months_to_update.add(merged_month_str)
        
        for month in months_to_update:
            update_balance_entry_for_month(month)
        
        return APIResponse(
            data=FixedExpenseEntry(**merged_entry),
            msg=f"Successfully merged {len(request.entry_ids)} fixed expense entr{'y' if len(request.entry_ids) == 1 else 'ies'}"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to merge fixed expense entries: {str(e)}")


@router.delete("/{entry_id}", response_model=APIResponse[dict])
async def delete_entry(entry_id: int):
    """Delete a fixed expense entry by ID."""
    # Get existing entry to check month before deletion
    existing = get_fixed_expense_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Fixed expense entry with id {entry_id} not found")
    
    deleted = delete_fixed_expense_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Fixed expense entry with id {entry_id} not found")
    
    # Check if this was month -1 and update balance if needed
    month_str = f"{existing['year']}-{existing['month']:02d}"
    if is_previous_month(month_str):
        update_balance_entry_for_month(month_str)
    
    return APIResponse(data=None, msg="Fixed expense entry deleted successfully")

