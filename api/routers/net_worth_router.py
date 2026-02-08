from fastapi import APIRouter, HTTPException

from exceptions import ValidationError
from schemas import APIResponse
from services.available_cash_services import calculate_available_cash
from services.debt_services import get_debt_entries_with_monthly_reduction
from services.savings_accounts_services import get_all_savings_accounts


router = APIRouter(prefix="/net-worth", tags=["net-worth"])


@router.get("", response_model=APIResponse[dict])
async def get_net_worth(month: str):
    """Get net worth for a specific month.
    
    Net worth = Available Cash + Total Savings - Total Debts
    
    Args:
        month: Month in YYYY-MM format (e.g., "2024-01" for January 2024)
    
    Returns:
        Dictionary containing:
        - available_cash: Available cash for the month
        - total_savings: Sum of all savings account base_balance values (snapshot when added; use contributions for changes)
        - total_debts: Sum of all debt current_balance values (adjusted for linked payments)
        - net_worth: available_cash + total_savings - total_debts
        - debts: Array of debt entries with adjusted balances
    """
    try:
        # Get available cash
        available_cash_data = calculate_available_cash(month)
        available_cash = available_cash_data["available_cash"]
        
        # Get all savings accounts and sum their balances
        savings_accounts = get_all_savings_accounts()
        total_savings = sum(account["base_balance"] for account in savings_accounts)
        
        # Get debt entries with monthly reduction applied
        debts = get_debt_entries_with_monthly_reduction(month)
        
        # Calculate total debts
        total_debts = sum(debt["current_balance"] for debt in debts)
        
        # Calculate net worth
        net_worth = available_cash + total_savings - total_debts
        
        return APIResponse(
            data={
                "available_cash": available_cash,
                "total_savings": total_savings,
                "total_debts": total_debts,
                "net_worth": net_worth,
                "debts": debts,
                "month": month
            },
            msg="Net worth calculated successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate net worth: {str(e)}")

