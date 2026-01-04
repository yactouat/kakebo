from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError
from typing import List

from dtos.project import Project, ProjectCreate, ProjectUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.projects_services import (
    calculate_project_progress,
    create_project,
    delete_project,
    get_all_projects,
    get_project_by_id,
    update_project
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=APIResponse[Project], status_code=201)
async def create_project_entry(entry: ProjectCreate):
    """Create a new project."""
    try:
        created = create_project(entry)
        return APIResponse(data=Project(**created), msg="Project created successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.delete("/{project_id}", response_model=APIResponse[dict])
async def delete_project_entry(project_id: int):
    """Delete a project by ID."""
    deleted = delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    return APIResponse(data=None, msg="Project deleted successfully")


@router.get("", response_model=APIResponse[List[Project]])
async def get_all_projects_filtered(
    status: str | None = None,
    savings_account_id: int | None = None
):
    """Get all projects with optional filters.

    Args:
        status: Filter by project status (Active, Paused, Completed, Cancelled)
        savings_account_id: Filter by linked savings account
    """
    try:
        projects = get_all_projects(status=status, savings_account_id=savings_account_id)
        return APIResponse(
            data=[Project(**p) for p in projects],
            msg="Projects retrieved successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")


@router.get("/{project_id}", response_model=APIResponse[Project])
async def get_project(project_id: int):
    """Get a single project by ID."""
    project = get_project_by_id(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")
    return APIResponse(data=Project(**project), msg="Project retrieved successfully")


@router.get("/{project_id}/progress", response_model=APIResponse[dict])
async def get_project_progress(project_id: int):
    """Calculate and return project progress."""
    try:
        progress_data = calculate_project_progress(project_id)
        return APIResponse(
            data=progress_data,
            msg="Project progress calculated successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate project progress: {str(e)}")


@router.put("/{project_id}", response_model=APIResponse[Project])
async def update_project_entry(project_id: int, entry_update: ProjectUpdate):
    """Update a project by ID."""
    existing = get_project_by_id(project_id)
    if existing is None:
        raise HTTPException(status_code=404, detail=f"Project with id {project_id} not found")

    try:
        updated = update_project(project_id, entry_update, existing)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update project")
        return APIResponse(data=Project(**updated), msg="Project updated successfully")
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")
