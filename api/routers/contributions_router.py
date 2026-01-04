from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.contribution import Contribution, ContributionCreate, ContributionUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.contributions_services import (
    create_contribution,
    delete_contribution,
    get_all_contributions,
    get_contribution_by_id,
    update_contribution
)
from services.savings_accounts_services import get_savings_account_by_id

router = APIRouter(prefix="/contributions", tags=["contributions"])


@router.post("", response_model=APIResponse[Contribution], status_code=201)
async def create_contribution_entry(entry: ContributionCreate):
    """Create a new contribution."""
    try:
        created = create_contribution(entry)
        return APIResponse(data=Contribution(**created), msg="Contribution created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create contribution: {str(e)}")


@router.delete("/{contribution_id}", response_model=APIResponse[dict])
async def delete_contribution_entry(contribution_id: int):
    """Delete a contribution by ID."""
    deleted = delete_contribution(contribution_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Contribution with id {contribution_id} not found")
    return APIResponse(data=None, msg="Contribution deleted successfully")


@router.get("", response_model=APIResponse[List[Contribution]])
async def get_all_contributions_by_account(savings_account_id: int):
    """Get all contributions for a specific savings account.

    Args:
        savings_account_id: Required filter for savings account
    """
    try:
        # Validate account exists
        account = get_savings_account_by_id(savings_account_id)
        if account is None:
            raise HTTPException(status_code=404, detail=f"Savings account with id {savings_account_id} not found")

        contributions = get_all_contributions(savings_account_id=savings_account_id)
        return APIResponse(
            data=[Contribution(**c) for c in contributions],
            msg="Contributions retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve contributions: {str(e)}")


@router.get("/{contribution_id}", response_model=APIResponse[Contribution])
async def get_contribution(contribution_id: int):
    """Get a single contribution by ID."""
    contribution = get_contribution_by_id(contribution_id)
    if contribution is None:
        raise HTTPException(status_code=404, detail=f"Contribution with id {contribution_id} not found")
    return APIResponse(data=Contribution(**contribution), msg="Contribution retrieved successfully")


@router.put("/{contribution_id}", response_model=APIResponse[Contribution])
async def update_contribution_entry(contribution_id: int, entry_update: ContributionUpdate):
    """Update a contribution by ID."""
    existing = get_contribution_by_id(contribution_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Contribution with id {contribution_id} not found")

    try:
        updated = update_contribution(contribution_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update contribution")
        return APIResponse(data=Contribution(**updated), msg="Contribution updated successfully")
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update contribution: {str(e)}")
