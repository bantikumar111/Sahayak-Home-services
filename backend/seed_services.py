import os
import sys

# Add backend directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config.db import services_col

services = [
    {"id": "plumber", "name": "Plumber", "icon": "🔧", "description": "Fix leaks, pipes, and water issues.", "color": "#1b6b63"},
    {"id": "electrician", "name": "Electrician", "icon": "⚡", "description": "Wiring, fans, and electrical faults.", "color": "#9d4d22"},
    {"id": "ac-repair", "name": "AC Repair", "icon": "❄️", "description": "Cooling issues and servicing.", "color": "#1e4c7a"},
    {"id": "carpenter", "name": "Carpenter", "icon": "🪚", "description": "Furniture repairs and woodwork.", "color": "#8b5a2b"},
    {"id": "painter", "name": "Painter", "icon": "🖌️", "description": "House painting and touchups.", "color": "#2c3e50"},
    {"id": "cleaning", "name": "Cleaning", "icon": "🧹", "description": "Deep cleaning and dusting.", "color": "#008080"},
    {"id": "washing-machine-repair", "name": "Washing Machine Repair", "icon": "🧺", "description": "Fix washing machine issues.", "color": "#3f51b5"},
    {"id": "refrigerator-repair", "name": "Refrigerator Repair", "icon": "🧊", "description": "Fridge cooling and freezing issues.", "color": "#00bcd4"},
    {"id": "microwave-repair", "name": "Microwave Repair", "icon": "🍲", "description": "Microwave oven repairs.", "color": "#ff9800"},
    {"id": "geyser-repair", "name": "Geyser Repair", "icon": "🌡️", "description": "Water heater installation and repairs.", "color": "#f44336"},
    {"id": "water-purifier", "name": "Water Purifier (RO) Service", "icon": "💧", "description": "RO service and filter change.", "color": "#03a9f4"},
    {"id": "cctv", "name": "CCTV Installation", "icon": "📹", "description": "Security camera setup and maintenance.", "color": "#607d8b"},
    {"id": "pest-control", "name": "Pest Control", "icon": "🪳", "description": "Eliminate bugs, roaches, and termites.", "color": "#795548"},
    {"id": "gardening", "name": "Gardening", "icon": "🌱", "description": "Plant care and lawn maintenance.", "color": "#4caf50"},
    {"id": "packers-movers", "name": "Packers & Movers", "icon": "📦", "description": "Relocation and moving assistance.", "color": "#ff5722"},
    {"id": "laptop-repair", "name": "Laptop Repair", "icon": "💻", "description": "Computer and laptop fixing.", "color": "#9c27b0"},
    {"id": "wifi-setup", "name": "WiFi Setup", "icon": "📶", "description": "Router configuration and internet setup.", "color": "#2196f3"},
    {"id": "home-tutor", "name": "Home Tutor", "icon": "📚", "description": "Private teaching and tutoring.", "color": "#673ab7"},
    {"id": "beauty-services", "name": "Beauty Services", "icon": "💅", "description": "Salon at home, makeup, and hair.", "color": "#e91e63"},
    {"id": "personal-trainer", "name": "Personal Trainer", "icon": "🏋️", "description": "Fitness coaching at home.", "color": "#ffc107"},
    {"id": "driver", "name": "Driver Service", "icon": "🚗", "description": "Hire a driver for your car.", "color": "#3f51b5"}
]

for s in services:
    services_col.update_one({"id": s["id"]}, {"$set": s}, upsert=True)

print("Successfully seeded services!")
