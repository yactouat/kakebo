from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.fixed_expense_entry import FixedExpenseEntry, FixedExpenseEntryCreate, FixedExpenseEntryUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.fixed_expense_entries_services import (
    create_fixed_expense_entry,
    get_all_fixed_expense_entries,
    get_fixed_expense_entry_by_id,
    update_fixed_expense_entry,
    delete_fixed_expense_entry,
)


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
        return APIResponse(data=FixedExpenseEntry(**created), msg="Fixed expense entry created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create fixed expense entry: {str(e)}")


@router.get("", response_model=APIResponse[List[FixedExpenseEntry]])
async def get_all_entries():
    """Get all fixed expense entries."""
    try:
        entries = get_all_fixed_expense_entries()
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
        return APIResponse(data=FixedExpenseEntry(**updated), msg="Fixed expense entry updated successfully")
    except HTTPException:
        raise
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update fixed expense entry: {str(e)}")


@router.delete("/{entry_id}", response_model=APIResponse[dict])
async def delete_entry(entry_id: int):
    """Delete a fixed expense entry by ID."""
    deleted = delete_fixed_expense_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Fixed expense entry with id {entry_id} not found")
    return APIResponse(data=None, msg="Fixed expense entry deleted successfully")

