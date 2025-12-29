# Balance Carry-Forward System

## Overview

The Kakebo application automatically carries forward the balance from the previous month to the current month. When you modify entries (income, fixed expenses, or actual expenses) from the previous month, the system recalculates that month's available cash and creates or updates a balance entry in the current month.

## How It Works

### Trigger Conditions

The balance carry-forward system is triggered automatically when:

1. **Any entry is created, updated, or deleted** in the previous month (month - 1)
2. The entry type can be:
   - Income entries
   - Fixed expense entries
   - Actual expense entries

### Calculation Process

When triggered, the system:

1. **Recalculates available cash** for the previous month using the formula:
   ```
   Available Cash = Total Income - Total Fixed Expenses - Total Actual Expenses
   ```

2. **Creates or updates a balance entry** based on the calculated available cash:
   - **If available cash > 0**: Creates/updates an **income entry** for the current month
   - **If available cash < 0**: Creates/updates an **actual expense entry** (category: UNFORESEEN) for the current month
   - **If available cash = 0**: No balance entry is created (returns None)

### Entry Details

**Item Label Format:**
- Both positive and negative balances use the same label format: `"{Month Name} {Year} balance"`
- Examples:
  - `"January 2026 balance"`
  - `"February 2026 balance"`

**Entry Properties:**
- **Date**: Set to the first day of the current month (`YYYY-MM-01`)
- **Amount**: Absolute value of the available cash
- **Currency**: Defaults to EUR
- **Category** (for negative balances): UNFORESEEN

**Update Behavior:**
- If a balance entry already exists for the month (found by matching the item label), it updates the existing entry
- If no balance entry exists, it creates a new one

## Implementation Details

### Key Functions

**`update_balance_entry_for_month(month: str)`**
- Main entry point called from routers
- Recalculates available cash and creates/updates the balance entry
- Located in: `/api/services/balance_entry_services.py`

**`create_or_update_balance_entry(month: str, available_cash: float)`**
- Core logic that determines entry type (income vs expense) and creates/updates accordingly
- Handles both positive and negative balances

**`find_balance_entry_by_month(month: str, is_income: bool)`**
- Searches for existing balance entries by matching the formatted item label
- Returns existing entry if found, None otherwise

**`format_month_name_for_balance(month: str)`**
- Formats month string (YYYY-MM) into balance entry label
- Returns: `"{Month Name} {Year} balance"`
- Located in: `/api/utils/month_utils.py`

### Integration Points

The balance entry update is triggered in all CRUD operations across:

- `/api/routers/income_entries_router.py`
- `/api/routers/fixed_expense_entries_router.py`
- `/api/routers/actual_expense_entries_router.py`

Each router checks if the modified entry belongs to the previous month using `is_previous_month()` and calls `update_balance_entry_for_month()` accordingly.

## Example Scenarios

### Scenario 1: Positive Balance Carry-Forward

**Previous Month (January 2026):**
- Total Income: €3,000
- Total Fixed Expenses: €1,500
- Total Actual Expenses: €1,200
- **Available Cash: €300**

**Result:**
- An income entry is created in February 2026:
  - Item: `"January 2026 balance"`
  - Amount: €300
  - Date: `2026-02-01`
  - Currency: EUR

### Scenario 2: Negative Balance Carry-Forward

**Previous Month (January 2026):**
- Total Income: €2,000
- Total Fixed Expenses: €1,500
- Total Actual Expenses: €1,200
- **Available Cash: -€700**

**Result:**
- An actual expense entry is created in February 2026:
  - Item: `"January 2026 balance"`
  - Amount: €700
  - Date: `2026-02-01`
  - Category: UNFORESEEN
  - Currency: EUR

### Scenario 3: Zero Balance

**Previous Month (January 2026):**
- Total Income: €2,000
- Total Fixed Expenses: €1,200
- Total Actual Expenses: €800
- **Available Cash: €0**

**Result:**
- No balance entry is created

## Notes

- The system only processes the **previous month** (month - 1), not arbitrary past months
- Balance entries are identified by their item label pattern, allowing automatic updates when the previous month's balance changes
- The system is idempotent: multiple updates to the same month will update the same balance entry rather than creating duplicates

