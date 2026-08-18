"""
Pydantic request/response models for Workers.
"""
from pydantic import BaseModel, Field
from app.models.user import Location


class Skill(BaseModel):
    service: str = Field(min_length=1, max_length=40)  # e.g. "plumber", "electrician"
    price: float = Field(gt=0)


class WorkerRegister(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(min_length=6, max_length=80)
    address: str = Field(min_length=5, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    skills: list[Skill] = Field(min_length=1)
    experience: int = Field(ge=0, default=0)
    location: Location

class WorkerUpdate(BaseModel):
    address: str | None = Field(default=None, min_length=5, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    available_days: list[str] | None = Field(default=None)
    available_hours: str | None = Field(default=None)

class SkillsUpdate(BaseModel):
    skills: list[Skill]
