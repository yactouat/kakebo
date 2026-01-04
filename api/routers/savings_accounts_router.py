from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.project import Project
from dtos.savings_account import SavingsAccount, SavingsAccountCreate, SavingsAccountUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.projects_services import get_all_projects
from services.savings_accounts_services import (
    create_savings_account,
    delete_savings_account,
    get_all_savings_accounts,
    get_savings_account_by_id,
    update_savings_account
)

router = APIRouter(prefix="/savings-accounts", tags=["savings-accounts"])


@router.post("", response_model=APIResponse[SavingsAccount], status_code=201)
async def create_account(entry: SavingsAccountCreate):
    """Create a new savings account."""
    try:
        created = create_savings_account(entry)
        return APIResponse(data=SavingsAccount(**created), msg="Savings account created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create savings account: {str(e)}")


@router.delete("/{account_id}", response_model=APIResponse[dict])
async def delete_account(account_id: int):
    """Delete a savings account by ID."""
    deleted = delete_savings_account(account_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Savings account with id {account_id} not found")
    return APIResponse(data=None, msg="Savings account deleted successfully")


@router.get("", response_model=APIResponse[List[SavingsAccount]])
async def get_all_accounts():
    """Get all savings accounts."""
    try:
        accounts = get_all_savings_accounts()
        return APIResponse(
            data=[SavingsAccount(**account) for account in accounts],
            msg="Savings accounts retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve savings accounts: {str(e)}")


@router.get("/{account_id}", response_model=APIResponse[dict])
async def get_account(account_id: int):
    """Get a single savings account with linked projects."""
    account = get_savings_account_by_id(account_id)
    if account is None:
        raise HTTPException(status_code=404, detail=f"Savings account with id {account_id} not found")

    # Get linked projects
    linked_projects = get_all_projects(savings_account_id=account_id)

    return APIResponse(
        data={
            "account": SavingsAccount(**account),
            "linked_projects": [Project(**p) for p in linked_projects]
        },
        msg="Savings account retrieved successfully"
    )


@router.put("/{account_id}", response_model=APIResponse[SavingsAccount])
async def update_account(account_id: int, entry_update: SavingsAccountUpdate):
    """Update a savings account by ID."""
    existing = get_savings_account_by_id(account_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Savings account with id {account_id} not found")

    try:
        updated = update_savings_account(account_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update savings account")
        return APIResponse(data=SavingsAccount(**updated), msg="Savings account updated successfully")
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update savings account: {str(e)}")
