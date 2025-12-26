from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.income_entry import (
    BulkIncomeEntryDeleteRequest,
    BulkIncomeEntryMergeRequest,
    BulkIncomeEntryUpdateRequest,
    IncomeEntry,
    IncomeEntryCreate,
    IncomeEntryUpdate,
)
from exceptions import ValidationError
from schemas import APIResponse
from services.balance_entry_services import update_balance_entry_for_month
from services.income_entries_services import (
    bulk_delete_income_entries,
    bulk_update_income_entries,
    create_income_entry,
    delete_income_entry,
    get_all_income_entries_by_month,
    get_income_entry_by_id,
    merge_income_entries,
    update_income_entry,
)
from utils.month_utils import extract_month_from_date, is_previous_month


router = APIRouter(prefix="/income-entries", tags=["income-entries"])


# CRUD endpoints for income_entries
@router.post("", response_model=APIResponse[IncomeEntry], status_code=201)
async def create_entry(entry: IncomeEntryCreate):
    """Create a new income entry.
    
    The IncomeEntryCreate DTO is automatically validated by Pydantic,
    ensuring all required fields are present and not None.
    """
    try:
        # The entry DTO is already validated by FastAPI/Pydantic
        created = create_income_entry(entry)
        
        # Check if this is month -1 and update balance if needed
        month = extract_month_from_date(entry.date)
        if month and is_previous_month(month):
            update_balance_entry_for_month(month)
        
        return APIResponse(data=IncomeEntry(**created), msg="Income entry created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create income entry: {str(e)}")


@router.get("", response_model=APIResponse[List[IncomeEntry]])
async def get_all_entries_by_month(month: str):
    """Get all income entries for a specific month.
    
    Args:
        month: Month in YYYY-MM format (e.g., "2024-01" for January 2024)
    """
    try:
        entries = get_all_income_entries_by_month(month)
        return APIResponse(
            data=[IncomeEntry(**entry) for entry in entries],
            msg="Income entries retrieved successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve income entries: {str(e)}")


@router.get("/{entry_id}", response_model=APIResponse[IncomeEntry])
async def get_entry(entry_id: int):
    """Get a single income entry by ID."""
    entry = get_income_entry_by_id(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Income entry with id {entry_id} not found")
    return APIResponse(data=IncomeEntry(**entry), msg="Income entry retrieved successfully")


@router.put("/{entry_id}", response_model=APIResponse[IncomeEntry])
async def update_entry(entry_id: int, entry_update: IncomeEntryUpdate):
    """Update an income entry by ID.
    
    The IncomeEntryUpdate DTO is automatically validated by Pydantic,
    ensuring that if fields are provided, they cannot be None (via model_validator).
    """
    # Get existing entry to fill in missing fields
    existing = get_income_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Income entry with id {entry_id} not found")
    
    # The entry_update DTO is already validated by FastAPI/Pydantic
    # The model_validator ensures no None values if fields are provided
    try:
        updated = update_income_entry(entry_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update income entry")
        
        # Check if this is month -1 and update balance if needed
        # Use updated date if provided, otherwise use existing date
        date_to_check = entry_update.date if entry_update.date is not None else existing["date"]
        month = extract_month_from_date(date_to_check)
        if month and is_previous_month(month):
            update_balance_entry_for_month(month)
        
        return APIResponse(data=IncomeEntry(**updated), msg="Income entry updated successfully")
    except HTTPException:
        raise
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update income entry: {str(e)}")


@router.delete("/bulk", response_model=APIResponse[dict])
async def bulk_delete_entries(request: BulkIncomeEntryDeleteRequest):
    """Delete multiple income entries by IDs."""
    if not request.entry_ids:
        raise HTTPException(status_code=400, detail="No entry IDs provided")
    
    # Get existing entries to check months before deletion
    existing_entries = []
    for entry_id in request.entry_ids:
        existing = get_income_entry_by_id(entry_id)
        if existing:
            existing_entries.append(existing)
    
    if not existing_entries:
        raise HTTPException(status_code=404, detail="No entries found with provided IDs")
    
    deleted_count = bulk_delete_income_entries(request.entry_ids)
    
    # Check if any were month -1 and update balance if needed
    months_to_update = set()
    for existing in existing_entries:
        month = extract_month_from_date(existing["date"])
        if month and is_previous_month(month):
            months_to_update.add(month)
    
    for month in months_to_update:
        update_balance_entry_for_month(month)
    
    return APIResponse(
        data={"deleted_count": deleted_count},
        msg=f"Successfully deleted {deleted_count} income entr{'y' if deleted_count == 1 else 'ies'}"
    )


@router.put("/bulk", response_model=APIResponse[dict])
async def bulk_update_entries(request: BulkIncomeEntryUpdateRequest):
    """Update multiple income entries with the same update data."""
    if not request.entry_ids:
        raise HTTPException(status_code=400, detail="No entry IDs provided")
    
    try:
        updated_count = bulk_update_income_entries(request.entry_ids, request.update)
        
        if updated_count == 0:
            raise HTTPException(status_code=404, detail="No entries found with provided IDs")
        
        # Check if any were month -1 and update balance if needed
        # Get existing entries to check months
        months_to_update = set()
        for entry_id in request.entry_ids:
            existing = get_income_entry_by_id(entry_id)
            if existing:
                date_to_check = request.update.date if request.update.date is not None else existing["date"]
                month = extract_month_from_date(date_to_check)
                if month and is_previous_month(month):
                    months_to_update.add(month)
        
        for month in months_to_update:
            update_balance_entry_for_month(month)
        
        return APIResponse(
            data={"updated_count": updated_count},
            msg=f"Successfully updated {updated_count} income entr{'y' if updated_count == 1 else 'ies'}"
        )
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update income entries: {str(e)}")


@router.post("/merge", response_model=APIResponse[IncomeEntry])
async def merge_entries(request: BulkIncomeEntryMergeRequest):
    """Merge multiple income entries into one.
    
    Merges entries by summing amounts, combining items, using most recent date,
    and using first entry's currency. Original entries are deleted.
    """
    if not request.entry_ids or len(request.entry_ids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 entry IDs are required to merge")
    
    try:
        # Get existing entries to check months before merge
        existing_entries = []
        for entry_id in request.entry_ids:
            existing = get_income_entry_by_id(entry_id)
            if existing:
                existing_entries.append(existing)
        
        if not existing_entries:
            raise HTTPException(status_code=404, detail="No entries found with provided IDs")
        
        # Perform merge
        merged_entry = merge_income_entries(request.entry_ids)
        
        # Check if any were month -1 and update balance if needed
        months_to_update = set()
        for existing in existing_entries:
            month = extract_month_from_date(existing["date"])
            if month and is_previous_month(month):
                months_to_update.add(month)
        
        # Also check the merged entry's month
        merged_month = extract_month_from_date(merged_entry["date"])
        if merged_month and is_previous_month(merged_month):
            months_to_update.add(merged_month)
        
        for month in months_to_update:
            update_balance_entry_for_month(month)
        
        return APIResponse(
            data=IncomeEntry(**merged_entry),
            msg=f"Successfully merged {len(request.entry_ids)} income entr{'y' if len(request.entry_ids) == 1 else 'ies'}"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to merge income entries: {str(e)}")


@router.delete("/{entry_id}", response_model=APIResponse[dict])
async def delete_entry(entry_id: int):
    """Delete an income entry by ID."""
    # Get existing entry to check month before deletion
    existing = get_income_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Income entry with id {entry_id} not found")
    
    deleted = delete_income_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Income entry with id {entry_id} not found")
    
    # Check if this was month -1 and update balance if needed
    month = extract_month_from_date(existing["date"])
    if month and is_previous_month(month):
        update_balance_entry_for_month(month)
    
    return APIResponse(data=None, msg="Income entry deleted successfully")

