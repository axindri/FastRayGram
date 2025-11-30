from pydantic import BaseModel


class RateLimitInfo(BaseModel):
    limit: int
    remaining: int
    reset: int
    retry_after: int | None
