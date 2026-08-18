"""
Pydantic request/response models for Messages (basic chat).
"""
from pydantic import BaseModel, Field
from typing import Literal


class MessageCreate(BaseModel):
    user_id: str
    worker_id: str
    sender: Literal["user", "worker"]
    message: str | None = Field(default="", max_length=1000)
    image: str | None = Field(default=None)


class MessageReadUpdate(BaseModel):
    viewer: Literal["user", "worker"]
