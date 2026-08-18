"""
Populates MongoDB with sample users, workers, bookings, reviews, and
messages so you can test the API / frontend immediately.

Run from the backend/ folder with:
    python seed_data.py
"""
from datetime import datetime, timezone
from app.config.db import (
    users_col, workers_col, bookings_col, reviews_col, messages_col, services_col, create_indexes,
)

def now():
    return datetime.now(timezone.utc)


def run():
    create_indexes()

    # Clear existing sample data (safe for a fresh dev DB)
    for col in (users_col, workers_col, bookings_col, reviews_col, messages_col, services_col):
        col.delete_many({})

    # --- Services ---
    services = [
        {"id": "plumber", "name": "Plumber", "icon": "🔧", "description": "Plumbing repairs and installations", "color": "#3b82f6"},
        {"id": "electrician", "name": "Electrician", "icon": "⚡", "description": "Electrical repairs and installations", "color": "#f59e0b"},
        {"id": "ac-repair", "name": "AC Repair", "icon": "❄️", "description": "Air conditioning repair and maintenance", "color": "#06b6d4"},
        {"id": "carpenter", "name": "Carpenter", "icon": "🪛", "description": "Carpentry and woodwork", "color": "#8b5cf6"},
        {"id": "painter", "name": "Painter", "icon": "🎨", "description": "Painting services", "color": "#ec4899"},
        {"id": "cleaning", "name": "Cleaning", "icon": "🧹", "description": "Home and office cleaning", "color": "#10b981"},
        {"id": "washing-machine-repair", "name": "Washing Machine Repair", "icon": "🧺", "description": "Washing machine repair", "color": "#f97316"},
        {"id": "refrigerator-repair", "name": "Refrigerator Repair", "icon": "❄️", "description": "Fridge repair and maintenance", "color": "#0ea5e9"},
        {"id": "microwave-repair", "name": "Microwave Repair", "icon": "🍕", "description": "Microwave repair services", "color": "#f59e0b"},
        {"id": "geyser-repair", "name": "Geyser Repair", "icon": "🚿", "description": "Water heater repair", "color": "#ef4444"},
        {"id": "water-purifier", "name": "Water Purifier (RO) Service", "icon": "💧", "description": "Water purifier maintenance", "color": "#3b82f6"},
        {"id": "cctv-installation", "name": "CCTV Installation", "icon": "📹", "description": "CCTV camera installation", "color": "#64748b"},
        {"id": "pest-control", "name": "Pest Control", "icon": "🐛", "description": "Pest control services", "color": "#059669"},
        {"id": "gardening", "name": "Gardening", "icon": "🌱", "description": "Garden maintenance", "color": "#84cc16"},
        {"id": "packers-movers", "name": "Packers & Movers", "icon": "📦", "description": "Packing and moving services", "color": "#d97706"},
        {"id": "laptop-repair", "name": "Laptop Repair", "icon": "💻", "description": "Laptop repair and maintenance", "color": "#1f2937"},
        {"id": "wifi-setup", "name": "WiFi Setup", "icon": "📊", "description": "WiFi router setup and installation", "color": "#8b5cf6"},
        {"id": "home-tutor", "name": "Home Tutor", "icon": "📚", "description": "Home tutoring services", "color": "#dc2626"},
        {"id": "beauty-services", "name": "Beauty Services", "icon": "💄", "description": "Beauty and grooming services", "color": "#ec4899"},
        {"id": "personal-trainer", "name": "Personal Trainer", "icon": "💪", "description": "Fitness training services", "color": "#f97316"},
        {"id": "driver-service", "name": "Driver Service", "icon": "🚗", "description": "Professional driver services", "color": "#0ea5e9"},
        {"id": "dog-walking", "name": "Dog walking", "icon": "🐕", "description": "Dog walking and pet care", "color": "#d97706"},
    ]
    services_col.insert_many(services)

    # --- Users (Ghaziabad / Delhi-NCR area coordinates) ---
    users = [
        {"name": "Rahul Sharma", "phone": "9876543210", "role": "user",
         "location": {"type": "Point", "coordinates": [77.4538, 28.6692]}, "created_at": now()},
        {"name": "Priya Verma", "phone": "9876543211", "role": "user",
         "location": {"type": "Point", "coordinates": [77.4127, 28.6448]}, "created_at": now()},
    ]
    user_ids = users_col.insert_many(users).inserted_ids

    # --- Workers ---
    workers = [
        {"name": "Ramesh Kumar", "phone": "9999999991", "role": "worker",
         "skills": [{"service": "plumber", "price": 200}, {"service": "tap-repair", "price": 150}],
         "experience": 5, "location": {"type": "Point", "coordinates": [77.4450, 28.6650]},
         "rating": 4.5, "total_reviews": 20, "created_at": now()},
        {"name": "Suresh Singh", "phone": "9999999992", "role": "worker",
         "skills": [{"service": "electrician", "price": 250}],
         "experience": 8, "location": {"type": "Point", "coordinates": [77.4300, 28.6550]},
         "rating": 4.8, "total_reviews": 35, "created_at": now()},
        {"name": "Vikas Yadav", "phone": "9999999993", "role": "worker",
         "skills": [{"service": "ac-repair", "price": 400}, {"service": "electrician", "price": 300}],
         "experience": 3, "location": {"type": "Point", "coordinates": [77.4600, 28.6700]},
         "rating": 4.2, "total_reviews": 12, "created_at": now()},
        {"name": "Anil Prajapati", "phone": "9999999994", "role": "worker",
         "skills": [{"service": "plumber", "price": 180}],
         "experience": 10, "location": {"type": "Point", "coordinates": [77.4000, 28.6400]},
         "rating": 4.9, "total_reviews": 50, "created_at": now()},
    ]
    worker_ids = workers_col.insert_many(workers).inserted_ids

    # --- Sample booking ---
    bookings_col.insert_one({
        "user_id": user_ids[0], "worker_id": worker_ids[0],
        "service": "plumber", "price": 200, "notes": "Kitchen tap leaking",
        "status": "pending", "created_at": now(), "updated_at": now(),
    })

    # --- Sample review ---
    reviews_col.insert_one({
        "user_id": user_ids[0], "worker_id": worker_ids[0], "booking_id": None,
        "rating": 5, "comment": "Fixed the leak quickly, very professional.",
        "created_at": now(),
    })

    # --- Sample chat messages ---
    messages_col.insert_many([
        {"user_id": user_ids[0], "worker_id": worker_ids[0], "sender": "user",
         "message": "Hi, is the tap repair available today?", "timestamp": now()},
        {"user_id": user_ids[0], "worker_id": worker_ids[0], "sender": "worker",
         "message": "Yes, I can come by evening around 6 PM.", "timestamp": now()},
    ])

    print("Seed data inserted successfully.")
    print(f"Sample user_id:   {user_ids[0]}")
    print(f"Sample worker_id: {worker_ids[0]}")


if __name__ == "__main__":
    run()
