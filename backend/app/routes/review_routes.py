"""
Review routes: add a review, fetch all reviews for a worker.
Adding a review also updates the worker's running `rating` average.
"""
from fastapi import APIRouter, HTTPException
from app.config.db import reviews_col, workers_col, users_col
from app.models.review import ReviewCreate
from app.utils.helpers import now_utc, to_object_id, serialize_many

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("/")
def create_review(payload: ReviewCreate):
    user_oid = to_object_id(payload.user_id)
    worker_oid = to_object_id(payload.worker_id)

    if not users_col.find_one({"_id": user_oid}) and not workers_col.find_one({"_id": user_oid}):
        raise HTTPException(status_code=404, detail="User not found")
    worker = workers_col.find_one({"_id": worker_oid})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    doc = {
        "user_id": user_oid,
        "worker_id": worker_oid,
        "booking_id": to_object_id(payload.booking_id) if payload.booking_id else None,
        "rating": payload.rating,
        "comment": payload.comment,
        "image": payload.image,
        "created_at": now_utc(),
    }
    reviews_col.insert_one(doc)

    # Recalculate the worker's average rating incrementally
    old_total = worker.get("total_reviews", 0)
    old_rating = worker.get("rating", 0.0)
    new_total = old_total + 1
    new_rating = round(((old_rating * old_total) + payload.rating) / new_total, 2)
    workers_col.update_one(
        {"_id": worker_oid},
        {"$set": {"rating": new_rating, "total_reviews": new_total}},
    )
    return {"message": "Review added", "worker_new_rating": new_rating}


@router.get("/{worker_id}")
def get_worker_reviews(worker_id: str):
    cursor = reviews_col.find({"worker_id": to_object_id(worker_id)}).sort("created_at", -1)
    return serialize_many(list(cursor))
