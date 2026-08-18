"""
Small shared helpers used across routes.
"""
from bson import ObjectId
from datetime import datetime, timezone
from fastapi import HTTPException


def now_utc():
    return datetime.now(timezone.utc)


def to_object_id(id_str: str) -> ObjectId:
    """Safely convert a string to a Mongo ObjectId, raising a clean 400 if invalid."""
    if not ObjectId.is_valid(id_str):
        raise HTTPException(status_code=400, detail=f"Invalid id: {id_str}")
    return ObjectId(id_str)


def serialize_doc(doc: dict) -> dict:
    """Convert a Mongo document into JSON-safe dict (ObjectId -> str)."""
    if not doc:
        return doc
    doc = dict(doc)
    doc["_id"] = str(doc["_id"])
    for key in ("user_id", "worker_id", "booking_id"):
        if key in doc and isinstance(doc[key], ObjectId):
            doc[key] = str(doc[key])
    for key in doc:
        if isinstance(doc[key], datetime):
            doc[key] = doc[key].isoformat()
    return doc


def serialize_many(docs) -> list:
    return [serialize_doc(d) for d in docs]
