from fastapi import APIRouter
from app.config.db import services_col
from app.models.service import ServiceCreate
from app.utils.helpers import serialize_doc

router = APIRouter(prefix="/services", tags=["services"])

@router.get("/")
def get_services():
    """Returns all available services"""
    services = list(services_col.find({}))
    return [serialize_doc(s) for s in services]

@router.post("/")
def create_service(payload: ServiceCreate):
    """Admin endpoint to create a new service category"""
    # Use the provided id as _id for consistency, or just keep it as a field.
    # Let's keep it as `id` field since MongoDB creates `_id`. 
    doc = {
        "id": payload.id,
        "name": payload.name,
        "icon": payload.icon,
        "description": payload.description,
        "color": payload.color
    }
    # upsert based on id
    services_col.update_one({"id": payload.id}, {"$set": doc}, upsert=True)
    return {"message": "Service created/updated successfully"}
