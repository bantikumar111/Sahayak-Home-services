from fastapi import APIRouter, Query
from app.config.db import services_col, workers_col
from app.utils.helpers import serialize_doc

router = APIRouter(prefix="/search", tags=["search"])

# Simple keyword mapping to map user problems to service IDs
KEYWORD_MAPPING = {
    "ac not cooling": "ac-repair",
    "ac issue": "ac-repair",
    "water leak": "plumber",
    "pipe broken": "plumber",
    "light issue": "electrician",
    "short circuit": "electrician",
    "fan not working": "electrician",
    "washing machine": "washing-machine-repair",
    "fridge": "refrigerator-repair",
    "refrigerator": "refrigerator-repair",
    "tv issue": "electrician",
    "cleaning": "cleaning",
    "clean house": "cleaning",
    "wood work": "carpenter",
    "furniture": "carpenter",
    "paint": "painter",
    "color": "painter",
    "bugs": "pest-control",
    "pest": "pest-control",
    "mosquito": "pest-control",
    "ro": "water-purifier",
    "water purifier": "water-purifier",
    "camera": "cctv",
    "cctv": "cctv",
    "garden": "gardening",
    "plants": "gardening",
    "move": "packers-movers",
    "packers": "packers-movers",
    "laptop": "laptop-repair",
    "computer": "laptop-repair",
    "wifi": "wifi-setup",
    "internet": "wifi-setup",
    "router": "wifi-setup",
    "teach": "home-tutor",
    "tutor": "home-tutor",
    "makeup": "beauty-services",
    "salon": "beauty-services",
    "gym": "personal-trainer",
    "trainer": "personal-trainer",
    "drive": "driver",
    "car": "driver"
}

@router.get("/")
def global_search(q: str = Query(..., min_length=1)):
    """Search services and workers."""
    q_lower = q.lower().strip()
    
    # 1. Map keyword to a specific service if possible
    mapped_service = None
    for keyword, service_id in KEYWORD_MAPPING.items():
        if keyword in q_lower:
            mapped_service = service_id
            break
            
    # 2. Search Services
    # If we found a mapped service, we can explicitly boost it, but for simplicity, 
    # we just run the text search. The mapped service will also be searched.
    search_query = q
    if mapped_service:
        # Add the mapped service name to the query to boost results in text search
        search_query += f" {mapped_service.replace('-', ' ')}"

    services_cursor = services_col.find(
        {"$text": {"$search": search_query}},
        {"score": {"$meta": "textScore"}}
    ).sort([("score", {"$meta": "textScore"})]).limit(10)
    
    services = [serialize_doc(s) for s in services_cursor]

    # 3. Search Workers
    # Also search workers with the text index
    workers_cursor = workers_col.find(
        {"$text": {"$search": search_query}},
        {"score": {"$meta": "textScore"}}
    ).sort([("score", {"$meta": "textScore"})]).limit(10)
    
    workers = [serialize_doc(w) for w in workers_cursor]

    # If text search didn't find anything, fallback to regex search for partial matches
    # MongoDB text search looks for whole words.
    if not services and not workers:
        regex_pattern = {"$regex": q_lower, "$options": "i"}
        
        fallback_services = services_col.find({
            "$or": [{"name": regex_pattern}, {"description": regex_pattern}]
        }).limit(10)
        services = [serialize_doc(s) for s in fallback_services]
        
        fallback_workers = workers_col.find({
            "$or": [{"name": regex_pattern}, {"skills.service": regex_pattern}]
        }).limit(10)
        workers = [serialize_doc(w) for w in fallback_workers]

    return {
        "services": services,
        "workers": workers
    }
