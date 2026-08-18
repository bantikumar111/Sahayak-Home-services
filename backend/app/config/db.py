"""
MongoDB connection + index setup.
Called once at app startup (see main.py's startup event).
"""
import os
from pymongo import MongoClient, ASCENDING, GEOSPHERE, DESCENDING
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "home_services")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections (imported elsewhere as db.users, db.workers, etc.)
services_col = db["services"]
users_col = db["users"]
workers_col = db["workers"]
bookings_col = db["bookings"]
reviews_col = db["reviews"]
messages_col = db["messages"]
otps_col = db["otps"]  # temporary mock-OTP storage


def create_indexes():
    """
    Creates all indexes needed for the MVP.
    Safe to call every startup — Mongo no-ops if the index already exists
    with the same spec.
    """
    # Services: text index for search
    services_col.create_index([("name", "text"), ("description", "text")])

    # Users: fast phone lookup + uniqueness for auth
    users_col.create_index([("phone", ASCENDING)], unique=True)

    # Workers: 2dsphere index enables $near / $geoWithin geospatial queries.
    # location must be stored in GeoJSON format: {"type": "Point", "coordinates": [lng, lat]}
    workers_col.create_index([("location", GEOSPHERE)])
    # Speeds up filtering workers by the service they offer
    workers_col.create_index([("skills.service", ASCENDING)])
    workers_col.create_index([("phone", ASCENDING)], unique=True)
    # Text index for searching workers
    workers_col.create_index([("name", "text"), ("skills.service", "text")])

    # Bookings: fetch a user's or worker's bookings quickly, newest first
    bookings_col.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    bookings_col.create_index([("worker_id", ASCENDING), ("created_at", DESCENDING)])

    # Reviews: fetch all reviews for a worker quickly
    reviews_col.create_index([("worker_id", ASCENDING), ("created_at", DESCENDING)])

    # Messages: fetch a chat thread between one user and one worker, in order
    messages_col.create_index([("user_id", ASCENDING), ("worker_id", ASCENDING), ("timestamp", ASCENDING)])

    # OTPs: auto-expire mock OTP documents after 5 minutes (TTL index)
    otps_col.create_index([("created_at", ASCENDING)], expireAfterSeconds=300)
