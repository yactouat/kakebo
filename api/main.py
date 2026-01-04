from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pathlib import Path

from db import init_db
from routers import (
    actual_expense_entries_router,
    autocomplete_router,
    available_cash_router,
    contributions_router,
    debt_router,
    fixed_expense_entries_router,
    income_entries_router,
    net_worth_router,
    projects_router,
    savings_accounts_router,
)
from schemas import APIResponse

load_dotenv(Path(__file__).parent / ".env")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: initialize database
    init_db()
    yield
    # shutdown: cleanup if needed
    pass


app = FastAPI(lifespan=lifespan)

# add CORS middleware to handle preflight OPTIONS requests
app.add_middleware(
    CORSMiddleware,
    allow_headers=["*"],
    allow_methods=["*"],
    allow_origins=[
        "*"
    ],  # in production, replace with specific origins like ["http://localhost:5173"]
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors and surface them properly."""
    errors = exc.errors()
    error_details = []
    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        error_details.append(
            {
                "field": field if field else "body",
                "message": error["msg"],
                "type": error["type"],
            }
        )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"msg": "Validation error", "errors": error_details},
    )


@app.get("/", response_model=APIResponse[dict])
async def root():
    return APIResponse(data=None, msg="kakebo backend is running")


# Include routers
app.include_router(actual_expense_entries_router.router)
app.include_router(autocomplete_router.router)
app.include_router(available_cash_router.router)
app.include_router(contributions_router.router)
app.include_router(debt_router.router)
app.include_router(fixed_expense_entries_router.router)
app.include_router(income_entries_router.router)
app.include_router(net_worth_router.router)
app.include_router(projects_router.router)
app.include_router(savings_accounts_router.router)
