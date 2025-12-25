from fastapi import FastAPI
from pydantic import BaseModel
from typing import Generic, TypeVar

app = FastAPI()

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    data: T | None
    msg: str


@app.get("/", response_model=APIResponse[dict])
async def root():
    return APIResponse(data=None, msg="kakebo backend is running")
