from fastapi import APIRouter, HTTPException

from schemas import APIResponse
from exceptions import ValidationError
from services.available_cash_services import calculate_available_cash


router = APIRouter(prefix="/available-cash", tags=["available-cash"])


@router.get("/by-month", response_model=APIResponse[dict])
async def get_available_cash_by_month(month: str):
    """Get available cash for a specific month.
    
    Available cash = Total income for the month - Total fixed expenses - Total actual expenses
    
    Args:
        month: Month in YYYY-MM format (e.g., "2024-01" for January 2024)
    """
    try:
        result = calculate_available_cash(month)
        return APIResponse(
            data=result,
            msg="Available cash calculated successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate available cash: {str(e)}")

