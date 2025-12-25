from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from schemas import APIResponse
from dtos.income_entry import IncomeEntry, IncomeEntryCreate, IncomeEntryUpdate
from services.income_entries_services import (
    create_income_entry,
    get_all_income_entries,
    get_income_entry_by_id,
    update_income_entry,
    delete_income_entry,
    ValidationError,
)


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
        return APIResponse(data=IncomeEntry(**created), msg="Income entry created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create income entry: {str(e)}")


@router.get("", response_model=APIResponse[List[IncomeEntry]])
async def get_all_entries():
    """Get all income entries."""
    try:
        entries = get_all_income_entries()
        return APIResponse(
            data=[IncomeEntry(**entry) for entry in entries],
            msg="Income entries retrieved successfully"
        )
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
        return APIResponse(data=IncomeEntry(**updated), msg="Income entry updated successfully")
    except HTTPException:
        raise
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update income entry: {str(e)}")


@router.delete("/{entry_id}", response_model=APIResponse[dict])
async def delete_entry(entry_id: int):
    """Delete an income entry by ID."""
    deleted = delete_income_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Income entry with id {entry_id} not found")
    return APIResponse(data=None, msg="Income entry deleted successfully")

