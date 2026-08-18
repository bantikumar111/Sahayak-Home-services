from pydantic import BaseModel, Field

class ServiceCreate(BaseModel):
    id: str = Field(..., description="The slug/identifier for the service, e.g., ac-repair")
    name: str = Field(..., min_length=1)
    icon: str = Field(..., description="Emoji or icon identifier")
    description: str = Field(default="")
    color: str = Field(default="#1b6b63")
