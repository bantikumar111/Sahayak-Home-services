"""
Pydantic request/response models for Users.
These validate incoming JSON — Mongo itself stays schema-less.
"""
from pydantic import BaseModel, Field, field_validator


class Location(BaseModel):
    lat: float
    lng: float

    @field_validator("lat")
    @classmethod
    def valid_lat(cls, v):
        if not -90 <= v <= 90:
            raise ValueError("lat must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def valid_lng(cls, v):
        if not -180 <= v <= 180:
            raise ValueError("lng must be between -180 and 180")
        return v


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: str = Field(pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(min_length=6, max_length=80)
    address: str = Field(min_length=5, max_length=150)
    location: Location | None = None


class LoginRequest(BaseModel):
    email: str = Field(pattern=r"^\S+@\S+\.\S+$")
    password: str = Field(min_length=6, max_length=80)

class UserUpdate(BaseModel):
    address: str | None = Field(default=None, min_length=5, max_length=150)
