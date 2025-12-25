from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from db import init_db
from routers import income_entries_router
from schemas import APIResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: initialize database
    init_db()
    yield
    # shutdown: cleanup if needed
    pass


app = FastAPI(lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors and surface them properly."""
    errors = exc.errors()
    error_details = []
    for error in errors:
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        error_details.append({
            "field": field if field else "body",
            "message": error["msg"],
            "type": error["type"]
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "msg": "Validation error",
            "errors": error_details
        }
    )


@app.get("/", response_model=APIResponse[dict])
async def root():
    return APIResponse(data=None, msg="kakebo backend is running")


# Include routers
app.include_router(income_entries_router.router)
