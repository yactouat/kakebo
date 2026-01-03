# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kakebo is a Japanese budgeting method application for personal finance management. The application tracks income, fixed expenses, and actual expenses (categorized as essential, comfort, entertainment, extras, or unforeseen). It calculates available cash per month.

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

## Development Guidelines

When working on this codebase, follow these guidelines:

**Frontend:**
- Ensure responsive design works on mobile, tablet, and desktop breakpoints using Mantine's Grid system
- Follow accessibility best practices (proper labels, ARIA attributes, keyboard navigation)
- Follow existing component organization: separate page components, form modals, and reusable components in appropriate directories
- Implement proper loading states and error boundaries in React components
- Use date-fns or native Date APIs for date formatting/manipulation in frontend
- Use Mantine's built-in form validation hooks (useForm) for client-side validation
- Use Zustand store's `dataChangeCounter` pattern for cross-component updates via `notifyDataChange()`
- We are using Mantine, so check the docs if you are unsure on how to properly implement this

**Backend:**
- Follow existing database initialization pattern in `/api/db.py` for schema changes
- Follow existing validation patterns using Pydantic models and custom validators in `/api/validators/`
- Implement proper database indexes for performance where needed
- Maintain consistency with existing router structure and service layer pattern (services return dicts, routers handle DTO conversion)
- Maintain consistent error handling and response formats across all endpoints (ValueError → 400, ValidationError → 422, generic → 500)
- Migrations are never to be rewritten; always write NEW queries to change database schema
- Validation should occur at multiple layers: Pydantic DTOs, custom validators, and business logic in services
- Use the standard `APIResponse<T>` wrapper format for all API responses
- When running Python code, always use `venv`

**Code Organization:**
- In all files you work in, sort functions alphabetically
- In Python, DO NOT import dependencies within functions to avoid circular imports, split logic into multiple files instead
- Reuse current codebase patterns, if you see occasions of lifting reusable logic (whether backend API or frontend) please do so

**Version Control:**
- DO NOT perform any git operations (add, commit, push, pull, etc.)
- DO NOT create commits or push changes to remote repositories
- Leave all version control operations to the developer
- Focus only on code implementation and testing
