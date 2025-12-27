from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError

from dtos.debt_entry import DebtEntry, DebtEntryCreate, DebtEntryUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.debt_services import (
    create_debt_entry,
    delete_debt_entry,
    get_all_debt_entries,
    get_debt_entry_by_id,
    update_debt_entry,
)


router = APIRouter(prefix="/debt-entries", tags=["debt-entries"])


@router.post("", response_model=APIResponse[DebtEntry], status_code=201)
async def create_entry(entry: DebtEntryCreate):
    """Create a new debt entry.
    
    The DebtEntryCreate DTO is automatically validated by Pydantic,
    ensuring all required fields are present and not None.
    """
    try:
        # The entry DTO is already validated by FastAPI/Pydantic
        created = create_debt_entry(entry)
        return APIResponse(data=DebtEntry(**created), msg="Debt entry created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create debt entry: {str(e)}")


@router.get("", response_model=APIResponse[list[DebtEntry]])
async def get_all_entries():
    """Get all debt entries."""
    try:
        entries = get_all_debt_entries()
        return APIResponse(
            data=[DebtEntry(**entry) for entry in entries],
            msg="Debt entries retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve debt entries: {str(e)}")


@router.get("/{entry_id}", response_model=APIResponse[DebtEntry])
async def get_entry(entry_id: int):
    """Get a single debt entry by ID."""
    entry = get_debt_entry_by_id(entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail=f"Debt entry with id {entry_id} not found")
    return APIResponse(data=DebtEntry(**entry), msg="Debt entry retrieved successfully")


@router.put("/{entry_id}", response_model=APIResponse[DebtEntry])
async def update_entry(entry_id: int, entry_update: DebtEntryUpdate):
    """Update a debt entry by ID.
    
    The DebtEntryUpdate DTO is automatically validated by Pydantic,
    ensuring that if fields are provided, they cannot be None (via model_validator).
    """
    # Get existing entry to fill in missing fields
    existing = get_debt_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Debt entry with id {entry_id} not found")
    
    # The entry_update DTO is already validated by FastAPI/Pydantic
    # The model_validator ensures no None values if fields are provided
    try:
        updated = update_debt_entry(entry_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update debt entry")
        return APIResponse(data=DebtEntry(**updated), msg="Debt entry updated successfully")
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update debt entry: {str(e)}")


@router.delete("/{entry_id}", response_model=APIResponse[dict])
async def delete_entry(entry_id: int):
    """Delete a debt entry by ID."""
    existing = get_debt_entry_by_id(entry_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Debt entry with id {entry_id} not found")
    
    deleted = delete_debt_entry(entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Debt entry with id {entry_id} not found")
    
    return APIResponse(data=None, msg="Debt entry deleted successfully")

