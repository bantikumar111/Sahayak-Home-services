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
        {"id": "cctv", "name": "CCTV Installation", "icon": "📹", "description": "CCTV camera installation", "color": "#64748b"},
        {"id": "pest-control", "name": "Pest Control", "icon": "🐛", "description": "Pest control services", "color": "#059669"},
        {"id": "gardening", "name": "Gardening", "icon": "🌱", "description": "Garden maintenance", "color": "#84cc16"},
        {"id": "packers-movers", "name": "Packers & Movers", "icon": "📦", "description": "Packing and moving services", "color": "#d97706"},
        {"id": "laptop-repair", "name": "Laptop Repair", "icon": "💻", "description": "Laptop repair and maintenance", "color": "#1f2937"},
        {"id": "wifi-setup", "name": "WiFi Setup", "icon": "📊", "description": "WiFi router setup and installation", "color": "#8b5cf6"},
        {"id": "home-tutor", "name": "Home Tutor", "icon": "📚", "description": "Home tutoring services", "color": "#dc2626"},
        {"id": "beauty-services", "name": "Beauty Services", "icon": "💄", "description": "Beauty and grooming services", "color": "#ec4899"},
        {"id": "personal-trainer", "name": "Personal Trainer", "icon": "💪", "description": "Fitness training services", "color": "#f97316"},
        {"id": "driver", "name": "Driver Service", "icon": "🚗", "description": "Professional driver services", "color": "#0ea5e9"},
        {"id": "dog-walking", "name": "Dog walking", "icon": "🐕", "description": "Dog walking and pet care", "color": "#d97706"},
    ]
    services_col.insert_many(services)

    # --- Users (NCR / Gurugram area coordinates) ---
    users = [
        {"name": "Rahul Sharma", "phone": "9876543210", "role": "user",
         "location": {"type": "Point", "coordinates": [77.0971, 28.4906]}, "created_at": now()},
        {"name": "Priya Verma", "phone": "9876543211", "role": "user",
         "location": {"type": "Point", "coordinates": [77.4127, 28.6448]}, "created_at": now()},
    ]
    user_ids = users_col.insert_many(users).inserted_ids

    # --- Workers (Covering all 22 services with NCR coordinates) ---
    workers = [
        # Plumber & Electrician
        {"name": "Ramesh Kumar", "phone": "9999999991", "role": "worker",
         "skills": [{"service": "plumber", "price": 200}],
         "experience": 5, "location": {"type": "Point", "coordinates": [77.0950, 28.4890]},
         "rating": 4.5, "total_reviews": 20, "created_at": now()},
        {"name": "Suresh Singh", "phone": "9999999992", "role": "worker",
         "skills": [{"service": "electrician", "price": 250}],
         "experience": 8, "location": {"type": "Point", "coordinates": [77.0980, 28.4920]},
         "rating": 4.8, "total_reviews": 35, "created_at": now()},
        {"name": "Vikas Yadav", "phone": "9999999993", "role": "worker",
         "skills": [{"service": "ac-repair", "price": 400}, {"service": "electrician", "price": 300}],
         "experience": 3, "location": {"type": "Point", "coordinates": [77.0910, 28.4850]},
         "rating": 4.2, "total_reviews": 12, "created_at": now()},
        {"name": "Anil Prajapati", "phone": "9999999994", "role": "worker",
         "skills": [{"service": "plumber", "price": 180}],
         "experience": 10, "location": {"type": "Point", "coordinates": [77.1000, 28.4950]},
         "rating": 4.9, "total_reviews": 50, "created_at": now()},
        
        # Home Tutor
        {"name": "Prof. Amit Verma", "phone": "9999999995", "role": "worker",
         "description": "10+ years experience in teaching Maths & Science for Class 8-12.",
         "skills": [{"service": "home-tutor", "price": 500}],
         "experience": 10, "location": {"type": "Point", "coordinates": [77.0960, 28.4910]},
         "rating": 4.9, "total_reviews": 28, "created_at": now()},
        {"name": "Neha Sharma", "phone": "9999999996", "role": "worker",
         "description": "English & Social Studies home tutor for primary and secondary students.",
         "skills": [{"service": "home-tutor", "price": 400}],
         "experience": 6, "location": {"type": "Point", "coordinates": [77.0930, 28.4870]},
         "rating": 4.7, "total_reviews": 19, "created_at": now()},

        # Beauty Services
        {"name": "Pooja Malhotra", "phone": "9999999997", "role": "worker",
         "description": "Professional salon at home, bridal makeup, facial, and hair styling.",
         "skills": [{"service": "beauty-services", "price": 600}],
         "experience": 7, "location": {"type": "Point", "coordinates": [77.0940, 28.4895]},
         "rating": 4.8, "total_reviews": 42, "created_at": now()},
        {"name": "Simran Kaur", "phone": "9999999998", "role": "worker",
         "description": "Certified beautician for home appointments, manicure & pedicure.",
         "skills": [{"service": "beauty-services", "price": 500}],
         "experience": 5, "location": {"type": "Point", "coordinates": [77.0975, 28.4930]},
         "rating": 4.6, "total_reviews": 15, "created_at": now()},

        # Personal Trainer
        {"name": "Vikram Rathore", "phone": "9999999999", "role": "worker",
         "description": "Certified fitness coach for weight loss, strength training, and yoga at home.",
         "skills": [{"service": "personal-trainer", "price": 800}],
         "experience": 8, "location": {"type": "Point", "coordinates": [77.0920, 28.4880]},
         "rating": 4.9, "total_reviews": 31, "created_at": now()},

        # Driver Service
        {"name": "Rajesh Sharma", "phone": "9999999901", "role": "worker",
         "description": "Experienced personal driver for city & outstation trips. Clean driving record.",
         "skills": [{"service": "driver", "price": 350}],
         "experience": 12, "location": {"type": "Point", "coordinates": [77.0965, 28.4905]},
         "rating": 4.8, "total_reviews": 64, "created_at": now()},
        {"name": "Dharmendra Singh", "phone": "9999999902", "role": "worker",
         "description": "Hourly and full day private car driver service.",
         "skills": [{"service": "driver", "price": 300}],
         "experience": 9, "location": {"type": "Point", "coordinates": [77.0985, 28.4940]},
         "rating": 4.7, "total_reviews": 23, "created_at": now()},

        # Dog Walking
        {"name": "Aarav Gupta", "phone": "9999999903", "role": "worker",
         "description": "Passionate pet lover with 4+ years dog walking & pet sitting experience.",
         "skills": [{"service": "dog-walking", "price": 250}],
         "experience": 4, "location": {"type": "Point", "coordinates": [77.0955, 28.4915]},
         "rating": 4.9, "total_reviews": 38, "created_at": now()},
        {"name": "Riya Sen", "phone": "9999999904", "role": "worker",
         "description": "Reliable daily dog walker and pet care provider.",
         "skills": [{"service": "dog-walking", "price": 200}],
         "experience": 3, "location": {"type": "Point", "coordinates": [77.0935, 28.4865]},
         "rating": 4.8, "total_reviews": 17, "created_at": now()},

        # Carpenter & Painter
        {"name": "Mohan Lal", "phone": "9999999905", "role": "worker",
         "skills": [{"service": "carpenter", "price": 300}],
         "experience": 15, "location": {"type": "Point", "coordinates": [77.0970, 28.4890]},
         "rating": 4.6, "total_reviews": 40, "created_at": now()},
        {"name": "Sunil Kumar", "phone": "9999999906", "role": "worker",
         "skills": [{"service": "painter", "price": 400}],
         "experience": 9, "location": {"type": "Point", "coordinates": [77.0915, 28.4860]},
         "rating": 4.5, "total_reviews": 22, "created_at": now()},

        # Cleaning & Appliances
        {"name": "Anita Devi", "phone": "9999999907", "role": "worker",
         "skills": [{"service": "cleaning", "price": 350}],
         "experience": 6, "location": {"type": "Point", "coordinates": [77.0962, 28.4922]},
         "rating": 4.7, "total_reviews": 29, "created_at": now()},
        {"name": "Deepak Verma", "phone": "9999999908", "role": "worker",
         "skills": [{"service": "washing-machine-repair", "price": 250}],
         "experience": 8, "location": {"type": "Point", "coordinates": [77.0945, 28.4885]},
         "rating": 4.4, "total_reviews": 18, "created_at": now()},
        {"name": "Rakesh Chawla", "phone": "9999999909", "role": "worker",
         "skills": [{"service": "refrigerator-repair", "price": 300}, {"service": "microwave-repair", "price": 250}],
         "experience": 11, "location": {"type": "Point", "coordinates": [77.0988, 28.4935]},
         "rating": 4.8, "total_reviews": 33, "created_at": now()},
        {"name": "Mahesh Babu", "phone": "9999999910", "role": "worker",
         "skills": [{"service": "geyser-repair", "price": 280}],
         "experience": 7, "location": {"type": "Point", "coordinates": [77.0925, 28.4875]},
         "rating": 4.6, "total_reviews": 21, "created_at": now()},

        # Water Purifier, CCTV & Pest Control
        {"name": "Gaurav Joshi", "phone": "9999999911", "role": "worker",
         "skills": [{"service": "water-purifier", "price": 320}],
         "experience": 5, "location": {"type": "Point", "coordinates": [77.0952, 28.4902]},
         "rating": 4.9, "total_reviews": 45, "created_at": now()},
        {"name": "Alok Mishra", "phone": "9999999912", "role": "worker",
         "skills": [{"service": "cctv", "price": 500}],
         "experience": 6, "location": {"type": "Point", "coordinates": [77.0968, 28.4918]},
         "rating": 4.7, "total_reviews": 27, "created_at": now()},
        {"name": "Vijay Kumar", "phone": "9999999913", "role": "worker",
         "skills": [{"service": "pest-control", "price": 450}],
         "experience": 10, "location": {"type": "Point", "coordinates": [77.0938, 28.4888]},
         "rating": 4.6, "total_reviews": 36, "created_at": now()},

        # Gardening, Packers, Tech & Wifi
        {"name": "Ramcharan", "phone": "9999999914", "role": "worker",
         "skills": [{"service": "gardening", "price": 300}],
         "experience": 14, "location": {"type": "Point", "coordinates": [77.0978, 28.4928]},
         "rating": 4.8, "total_reviews": 52, "created_at": now()},
        {"name": "Shyam Transport", "phone": "9999999915", "role": "worker",
         "skills": [{"service": "packers-movers", "price": 1500}],
         "experience": 8, "location": {"type": "Point", "coordinates": [77.0918, 28.4858]},
         "rating": 4.5, "total_reviews": 19, "created_at": now()},
        {"name": "TechCare Solutions", "phone": "9999999916", "role": "worker",
         "skills": [{"service": "laptop-repair", "price": 400}],
         "experience": 7, "location": {"type": "Point", "coordinates": [77.0948, 28.4898]},
         "rating": 4.7, "total_reviews": 26, "created_at": now()},
        {"name": "NetFast Experts", "phone": "9999999917", "role": "worker",
         "skills": [{"service": "wifi-setup", "price": 250}],
         "experience": 4, "location": {"type": "Point", "coordinates": [77.0964, 28.4914]},
         "rating": 4.6, "total_reviews": 14, "created_at": now()},
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
