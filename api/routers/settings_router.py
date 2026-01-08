"""Router for settings endpoints."""
from fastapi import APIRouter, HTTPException

from dtos.setting import Setting, SettingUpdate
from exceptions import ValidationError
from schemas import APIResponse
from services.settings_services import get_setting_by_key, update_setting


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/{key}", response_model=APIResponse[Setting])
async def get_setting(key: str):
    """Get a setting by key."""
    setting = get_setting_by_key(key)
    if setting is None:
        raise HTTPException(
            status_code=404, detail=f"Setting with key '{key}' not found"
        )
    return APIResponse(data=Setting(**setting), msg="Setting retrieved successfully")


@router.put("/{key}", response_model=APIResponse[Setting])
async def update_setting_value(key: str, entry_update: SettingUpdate):
    """Update a setting value."""
    try:
        updated = update_setting(key, entry_update)
        if updated is None:
            raise HTTPException(status_code=500, detail="Failed to update setting")
        return APIResponse(data=Setting(**updated), msg="Setting updated successfully")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update setting: {str(e)}"
        )
