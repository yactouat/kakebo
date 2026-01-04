from pydantic import BaseModel


class AutocompleteSuggestion(BaseModel):
    id: int
    entity: str
    field: str
    value: str
    usage_count: int
    last_used_at: str
    created_at: str


class AutocompleteSuggestionCreate(BaseModel):
    entity: str
    field: str
    value: str


class AutocompleteSuggestionsResponse(BaseModel):
    suggestions: list[str]

