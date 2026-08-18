"""
Pydantic request/response models for Bookings.
"""
from pydantic import BaseModel, Field
from typing import Literal

BookingStatus = Literal["pending", "accepted", "rejected", "completed", "cancelled"]


class BookingCreate(BaseModel):
    user_id: str
    worker_id: str
    service: str = Field(min_length=1, max_length=40)
    price: float = Field(gt=0)
    notes: str | None = Field(default=None, max_length=300)
    scheduled_date: str | None = Field(default=None)
    scheduled_time: str | None = Field(default=None)


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
