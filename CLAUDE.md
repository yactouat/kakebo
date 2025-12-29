# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kakebo is a Japanese budgeting method application for personal finance management. The application tracks income, fixed expenses, and actual expenses (categorized as essential, comfort, entertainment, extras, or unforeseen). It calculates available cash per month and automatically carries forward balance entries between months.

## Architecture

**Stack:**
- **Backend:** FastAPI (Python) with SQLite database
- **Frontend:** React 19 + TypeScript + Vite + Mantine UI
- **State Management:** Zustand with localStorage persistence
- **API Pattern:** RESTful with generic `APIResponse<T>` wrapper format

**Key Patterns:**
- Backend uses modular router organization under `/api/routers/` with dedicated service layer in `/api/services/`
- Services return dictionaries; routers handle Pydantic DTO conversion
- Frontend uses custom `useEntryTable` hook for reusable CRUD operations across all entry types
- Global state in Zustand manages UI coordination (tabs, month/year selection) and data change notifications via counter pattern
- Balance carry-forward system automatically creates income/expense entries when previous month data changes

## Development Commands

### Backend (from `/api` directory)

**Setup:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Run development server:**
```bash
source venv/bin/activate
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. The database (`kakebo.db`) auto-initializes on first run.

### Frontend (from `/frontend` directory)

**Setup:**
```bash
yarn install
```

**Development server:**
```bash
yarn dev
```

**Build:**
```bash
yarn build
```

**Lint:**
```bash
yarn lint
```

**Environment Configuration:**
Create `/frontend/.env` with:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Database Schema

**Tables:**
- `income_entries`: id, amount, date (YYYY-MM-DD), item, currency
- `fixed_expense_entries`: id, amount, item, currency, month (1-12), year
- `actual_expense_entries`: id, amount, date (YYYY-MM-DD), item, category, currency

Database migrations are handled automatically via `init_db()` which adds missing columns if schema changes.

## API Routing Structure

**Standard CRUD endpoints per resource:**
- `POST /` - Create entry
- `GET /?month=YYYY-MM` - Get all entries for month (month parameter required)
- `GET /{entry_id}` - Get single entry
- `PUT /{entry_id}` - Update entry
- `DELETE /{entry_id}` - Delete entry

**Resources:**
- `/income-entries`
- `/fixed-expense-entries`
- `/actual-expense-entries`
- `/available-cash` - Special GET endpoint that calculates total_income, total_fixed_expenses, total_actual_expenses, and available_cash for a given month

## Validation Strategy

**Multi-layer validation:**
- Pydantic models for type checking and required fields (`/api/dtos/`)
- Custom validators in `/api/validators/`:
  - `no_null_validator`: Ensures provided fields cannot be None
  - `month_validator`: Validates YYYY-MM format and month range (1-12)
- Business logic validation in services (e.g., amount must be >= 0)

**Frontend:** Mantine form validation with real-time feedback

## Balance Carry-Forward System

When modifying entries from a previous month, the system automatically:
1. Calculates the previous month's available cash
2. If positive: creates an income entry for current month with item "{Month} {Year} balance"
3. If negative: creates an unforeseen expense entry for current month
4. This logic is in `/api/services/balance_entry_services.py`

**For detailed documentation, see:** [Balance Carry-Forward System](docs/balance-carry-forward.md)

## Backup System

The application includes an automated backup system that uploads the SQLite database (`kakebo.db`) to Google Drive on a schedule. The backup script uses Google Service Account authentication with Domain-Wide Delegation, which requires Google Workspace Admin privileges.

**Backup script:** `/api/scripts/backup_db_to_gdrive.py`
- Uploads `kakebo.db` to a Google Drive folder named `kakebo`
- Creates timestamped backup copies for historical retention
- Uses service account credentials from `api/gdrive-sa-creds.json`
- Requires `IMPERSONATED_USER_EMAIL` environment variable in `api/.env`

**For detailed setup instructions, see:** [Automated Database Backup to Google Drive](docs/backup-to-gdrive.md)

## State Management Details

**Zustand store** (`/frontend/src/stores/useAppStore.ts`):
- Persisted to localStorage under key `kakebo-storage`
- `dataChangeCounter` is incremented via `notifyDataChange()` to trigger component re-fetches after mutations
- Used for coordinating updates across components (e.g., Available Cash recalculation)

**For comprehensive documentation, see:** [Frontend State Management](docs/frontend-state-management.md)

The application uses a hybrid approach:
- **Global store (Zustand)**: Shared filters (`selectedMonth`/`selectedYear`), persisted UI state (`activeTab`), and coordination mechanism (`dataChangeCounter`/`notifyDataChange()`)
- **Component-local state (useState)**: Data fetching, calculated values, UI state
- **Data change pattern**: Call `notifyDataChange()` after mutations, listen to `dataChangeCounter` in `useEffect` dependencies for automatic re-renders

## Key File Locations

**Backend:**
- Entry point: `/api/main.py`
- Database setup: `/api/db.py`
- Routers: `/api/routers/`
- Business logic: `/api/services/`
- DTOs: `/api/dtos/`
- Validators: `/api/validators/`
- Utilities: `/api/utils/`

**Frontend:**
- Entry point: `/frontend/src/main.tsx`
- Main app: `/frontend/src/App.tsx`
- State management: `/frontend/src/stores/useAppStore.ts`
- API clients: `/frontend/src/services/`
- Reusable CRUD hook: `/frontend/src/hooks/useEntryTable.ts`
- Components: `/frontend/src/components/`
- TypeScript models: `/frontend/src/models/`

## Currency Handling

Currency is stored per entry (not global) with EUR as default. No currency conversion logic is currently implemented.
