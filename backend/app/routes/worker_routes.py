"""
Worker routes: registration, geospatial search, profile, login.
"""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
import shutil
import os
import uuid
from app.config.db import workers_col
from app.models.worker import WorkerRegister, Skill, WorkerUpdate, SkillsUpdate
from app.models.user import LoginRequest
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from app.utils.helpers import now_utc, to_object_id, serialize_doc, serialize_many

router = APIRouter(prefix="/workers", tags=["workers"])


@router.post("/register")
def register_worker(payload: WorkerRegister):
    existing = workers_col.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered as a worker.")

    doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": get_password_hash(payload.password),
        "role": "worker",
        "address": payload.address,
        "description": payload.description,
        "skills": [s.model_dump() for s in payload.skills],
        "experience": payload.experience,
        # GeoJSON Point required for the 2dsphere index / $near queries
        "location": {"type": "Point", "coordinates": [payload.location.lng, payload.location.lat]},
        "rating": 0.0,
        "total_reviews": 0,
        "created_at": now_utc(),
    }
    result = workers_col.insert_one(doc)
    return {"message": "Worker registered", "worker_id": str(result.inserted_id)}


@router.get("/")
def list_workers(
    service: str = Query(None, description="Service category e.g. plumber, electrician"),
    lat: float = Query(None, description="User's latitude"),
    lng: float = Query(None, description="User's longitude"),
    radius_km: float = Query(10, gt=0, le=100, description="Search radius in kilometers"),
    min_rating: float = Query(None, ge=0, le=5, description="Minimum rating"),
    max_price: float = Query(None, ge=0, description="Maximum price for the service"),
):
    """
    Finds workers. Optionally filtering by service, location, rating, and price.
    """
    query = {}
    
    if service:
        query["skills.service"] = service

    if lat is not None and lng is not None:
        query["location"] = {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": radius_km * 1000,  # $near uses meters
            }
        }

    if min_rating is not None:
        query["rating"] = {"$gte": min_rating}

    if max_price is not None and service:
        # We need to filter based on the price of the specific service requested
        query["skills"] = {
            "$elemMatch": {
                "service": service,
                "price": {"$lte": max_price}
            }
        }

    cursor = workers_col.find(query)
    
    # If no location is provided, $near is not used, so we should sort by rating or something
    if lat is None or lng is None:
        cursor = cursor.sort("rating", -1)
        
    results = list(cursor)
    
    # Fallback: if nearby search yielded 0 results and location was specified, retry without location restriction
    if not results and (lat is not None or lng is not None):
        fallback_query = {}
        if service:
            fallback_query["skills.service"] = service
        if min_rating is not None:
            fallback_query["rating"] = {"$gte": min_rating}
        if max_price is not None and service:
            fallback_query["skills"] = {"$elemMatch": {"service": service, "price": {"$lte": max_price}}}
        results = list(workers_col.find(fallback_query).sort("rating", -1))
        
    return serialize_many(results)


@router.get("/{worker_id}")
def get_worker(worker_id: str):
    worker = workers_col.find_one({"_id": to_object_id(worker_id)})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return serialize_doc(worker)


@router.patch("/{worker_id}/skills")
def update_worker_skills(worker_id: str, payload: SkillsUpdate):
    # Allow workers to update their list of offered services
    from app.utils.helpers import to_object_id
    worker_oid = to_object_id(worker_id)
    
    worker = workers_col.find_one({"_id": worker_oid})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Convert Skill objects to dicts
    skills_data = [s.model_dump() for s in payload.skills]
    
    workers_col.update_one(
        {"_id": worker_oid},
        {"$set": {"skills": skills_data}}
    )
    return {"message": "Skills updated successfully", "skills": skills_data}


@router.post("/login")
def worker_login(payload: LoginRequest):
    worker = workers_col.find_one({"email": payload.email})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    if not verify_password(payload.password, worker.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid password")
        
    token = create_access_token(subject=str(worker["_id"]), role="worker")
    
    # Don't send password hash to the frontend
    worker.pop("password_hash", None)
    
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "worker": serialize_doc(worker),
    }

@router.patch("/{worker_id}")
def update_worker_profile(worker_id: str, payload: WorkerUpdate):
    from app.utils.helpers import to_object_id
    update_data = {}
    if payload.address is not None:
        update_data["address"] = payload.address
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.available_days is not None:
        update_data["available_days"] = payload.available_days
    if payload.available_hours is not None:
        update_data["available_hours"] = payload.available_hours
        
    if not update_data:
        return {"message": "No changes requested"}
        
    result = workers_col.update_one(
        {"_id": to_object_id(worker_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {"message": "Profile updated successfully"}

@router.post("/{worker_id}/avatar")
def upload_worker_avatar(worker_id: str, file: UploadFile = File(...)):
    from app.utils.helpers import to_object_id
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/uploads/{filename}"
    
    result = workers_col.update_one(
        {"_id": to_object_id(worker_id)},
        {"$set": {"avatar": avatar_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    return {"message": "Avatar updated", "avatar_url": avatar_url}
