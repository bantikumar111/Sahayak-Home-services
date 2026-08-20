"""
Booking routes: request-based booking (no scheduling calendar for MVP).
"""
from fastapi import APIRouter, HTTPException
from app.config.db import bookings_col, workers_col, users_col
from app.models.booking import BookingCreate, BookingStatusUpdate
from app.utils.helpers import now_utc, to_object_id, serialize_doc, serialize_many

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("")
@router.post("/")
def create_booking(payload: BookingCreate):
    user_oid = to_object_id(payload.user_id)
    worker_oid = to_object_id(payload.worker_id)

    if not users_col.find_one({"_id": user_oid}) and not workers_col.find_one({"_id": user_oid}):
        raise HTTPException(status_code=404, detail="User account not found. Please log in or register first.")
    if not workers_col.find_one({"_id": worker_oid}):
        raise HTTPException(status_code=404, detail="Worker not found")

    doc = {
        "user_id": user_oid,
        "worker_id": worker_oid,
        "service": payload.service,
        "price": payload.price,
        "notes": payload.notes,
        "scheduled_date": payload.scheduled_date,
        "scheduled_time": payload.scheduled_time,
        "status": "pending",
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    result = bookings_col.insert_one(doc)
    return {"message": "Booking created", "booking_id": str(result.inserted_id)}


@router.get("/user/{user_id}")
def get_user_bookings(user_id: str):
    cursor = bookings_col.find({"user_id": to_object_id(user_id)}).sort("created_at", -1)
    bookings = list(cursor)
    
    # Extract unique worker_ids
    worker_ids = list({b["worker_id"] for b in bookings})
    
    # Fetch workers
    workers_data = list(workers_col.find({"_id": {"$in": worker_ids}}))
    
    # Build a lookup map
    worker_map = {w["_id"]: w for w in workers_data}
    
    # Embed worker details
    for b in bookings:
        worker = worker_map.get(b["worker_id"], {})
        b["worker"] = {
            "name": worker.get("name", "Unknown Worker"),
            "rating": worker.get("rating", 0.0),
            "experience": worker.get("experience", 0),
            "avatar": worker.get("avatar", "")
        }
        
    return serialize_many(bookings)


@router.get("/worker/{worker_id}")
def get_worker_bookings(worker_id: str):
    cursor = bookings_col.find({"worker_id": to_object_id(worker_id)}).sort("created_at", -1)
    bookings = list(cursor)
    
    # Extract unique user_ids
    user_ids = list({b["user_id"] for b in bookings})
    
    # Fetch from both collections (customers and workers acting as customers)
    users_data = list(users_col.find({"_id": {"$in": user_ids}}))
    workers_data = list(workers_col.find({"_id": {"$in": user_ids}}))
    
    # Build a lookup map
    user_map = {u["_id"]: u for u in users_data + workers_data}
    
    # Embed customer details
    for b in bookings:
        customer = user_map.get(b["user_id"], {})
        b["customer"] = {
            "name": customer.get("name", "Unknown"),
            "email": customer.get("email", ""),
            "address": customer.get("address", ""),
            "avatar": customer.get("avatar", "")
        }
        
    return serialize_many(bookings)


@router.patch("/{booking_id}")
def update_booking_status(booking_id: str, payload: BookingStatusUpdate):
    result = bookings_col.update_one(
        {"_id": to_object_id(booking_id)},
        {"$set": {"status": payload.status, "updated_at": now_utc()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": f"Booking status updated to '{payload.status}'"}
