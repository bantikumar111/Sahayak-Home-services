"""
Pydantic request/response models for Reviews.
"""
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    user_id: str
    worker_id: str
    booking_id: str | None = None
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)
    image: str | None = Field(default=None)
