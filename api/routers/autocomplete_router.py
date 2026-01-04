from fastapi import APIRouter, HTTPException
from typing import List

from dtos.autocomplete import AutocompleteSuggestionCreate, AutocompleteSuggestionsResponse
from schemas import APIResponse
from services.autocomplete_services import get_autocomplete_suggestions, save_autocomplete_suggestion


router = APIRouter(prefix="/autocomplete", tags=["autocomplete"])


@router.get("/{entity}/{field}", response_model=APIResponse[AutocompleteSuggestionsResponse])
async def get_suggestions(entity: str, field: str, limit: int = 10):
    """Get autocomplete suggestions for an entity and field.
    
    Args:
        entity: The entity name (e.g., "actual_expense_entries", "projects")
        field: The field name (e.g., "item", "name")
        limit: Maximum number of suggestions to return (default: 10, max: 50)
    """
    if limit < 1 or limit > 50:
        raise HTTPException(status_code=400, detail="Limit must be between 1 and 50")
    
    try:
        suggestions = get_autocomplete_suggestions(entity, field, limit)
        return APIResponse(
            data=AutocompleteSuggestionsResponse(suggestions=suggestions),
            msg="Autocomplete suggestions retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve autocomplete suggestions: {str(e)}")


@router.post("", response_model=APIResponse[dict])
async def save_suggestion(suggestion: AutocompleteSuggestionCreate):
    """Save an autocomplete suggestion.
    
    If the suggestion already exists, its usage count is incremented.
    Otherwise, a new suggestion is created.
    """
    if not suggestion.value or not suggestion.value.strip():
        raise HTTPException(status_code=400, detail="Suggestion value cannot be empty")
    
    try:
        save_autocomplete_suggestion(suggestion.entity, suggestion.field, suggestion.value)
        return APIResponse(
            data=None,
            msg="Autocomplete suggestion saved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save autocomplete suggestion: {str(e)}")

