from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.contribution_dtos import Contribution, ContributionCreate
from exceptions import ValidationError
from schemas import APIResponse
from services.contribution_services import (
    create_contribution,
    delete_contribution,
    get_contribution_history_by_month,
    get_contributions_by_project,
)


router = APIRouter(prefix="/contributions", tags=["contributions"])


@router.post("/projects/{project_id}/contributions", response_model=APIResponse[Contribution], status_code=201)
async def create_contribution_route(project_id: int, contribution: ContributionCreate):
    """Create a new contribution for a project.
    
    The ContributionCreate DTO is automatically validated by Pydantic,
    ensuring all required fields are present and not None.
    """
    try:
        # Ensure project_id in path matches the one in the body
        if contribution.project_id != project_id:
            raise HTTPException(
                status_code=400,
                detail=f"Project ID in path ({project_id}) does not match project ID in body ({contribution.project_id})"
            )
        # The contribution DTO is already validated by FastAPI/Pydantic
        created = create_contribution(contribution)
        return APIResponse(data=Contribution(**created), msg="Contribution created successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create contribution: {str(e)}")


@router.delete("/{contribution_id}", response_model=APIResponse)
async def delete_contribution_route(contribution_id: int):
    """Delete a contribution by ID."""
    try:
        delete_contribution(contribution_id)
        return APIResponse(data=None, msg="Contribution deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete contribution: {str(e)}")


@router.get("/projects/{project_id}/contributions/history", response_model=APIResponse[dict])
async def get_contribution_history_route(project_id: int):
    """Get monthly aggregated contribution history for a project.
    
    Returns a dictionary with months (YYYY-MM) as keys and total amounts as values.
    """
    try:
        history = get_contribution_history_by_month(project_id)
        return APIResponse(data=history, msg="Contribution history retrieved successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve contribution history: {str(e)}")


@router.get("/projects/{project_id}/contributions", response_model=APIResponse[List[Contribution]])
async def get_contributions_route(project_id: int):
    """List all contributions for a project, ordered by date DESC."""
    try:
        contributions = get_contributions_by_project(project_id)
        return APIResponse(
            data=[Contribution(**contribution) for contribution in contributions],
            msg="Contributions retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve contributions: {str(e)}")

