from fastapi import APIRouter, HTTPException
from pydantic import ValidationError as PydanticValidationError

from dtos.project_dtos import Project, ProjectCreate, ProjectResponse, ProjectUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.project_services import (
    create_project,
    delete_project,
    get_all_projects,
    get_project_by_id,
    update_project,
)


router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=APIResponse[Project], status_code=201)
async def create_project_route(project: ProjectCreate):
    """Create a new project.
    
    The ProjectCreate DTO is automatically validated by Pydantic,
    ensuring all required fields are present and not None.
    """
    try:
        # The project DTO is already validated by FastAPI/Pydantic
        created = create_project(project)
        return APIResponse(data=Project(**created), msg="Project created successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.delete("/{project_id}", response_model=APIResponse)
async def delete_project_route(project_id: int):
    """Delete a project by ID."""
    try:
        delete_project(project_id)
        return APIResponse(data=None, msg="Project deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")


@router.get("/", response_model=APIResponse[list[ProjectResponse]])
async def get_all_projects_route(
    status: str | None = None,
    priority: str | None = None,
    category: str | None = None
):
    """Get all projects with optional filters.
    
    Args:
        status: Optional status filter ('active' or 'completed')
        priority: Optional priority filter ('high', 'medium', or 'low')
        category: Optional category filter
    """
    try:
        projects = get_all_projects(status=status, priority=priority, category=category)
        return APIResponse(
            data=[ProjectResponse(**project) for project in projects],
            msg="Projects retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve projects: {str(e)}")


@router.get("/{project_id}", response_model=APIResponse[ProjectResponse])
async def get_project_route(project_id: int):
    """Get a single project by ID with calculated fields."""
    try:
        project = get_project_by_id(project_id)
        return APIResponse(data=ProjectResponse(**project), msg="Project retrieved successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project: {str(e)}")


@router.put("/{project_id}", response_model=APIResponse[ProjectResponse])
async def update_project_route(project_id: int, project_update: ProjectUpdate):
    """Update a project by ID.
    
    The ProjectUpdate DTO is automatically validated by Pydantic,
    ensuring that if fields are provided, they cannot be None (via model_validator).
    """
    try:
        updated = update_project(project_id, project_update)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update project")
        return APIResponse(data=ProjectResponse(**updated), msg="Project updated successfully")
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except PydanticValidationError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

