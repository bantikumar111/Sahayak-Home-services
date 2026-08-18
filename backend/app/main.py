"""
App entrypoint. Run with:
    uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.db import create_indexes
from app.routes import (
    user_routes,
    worker_routes,
    booking_routes,
    review_routes,
    message_routes,
    service_routes,
    search_routes,
    upload_routes,
)


import os
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Hyperlocal Home Services API",
    description="MVP backend for a plumber/electrician/AC-repair marketplace",
    version="1.0.0",
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Mobile-first low-bandwidth React app runs on a different port during dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your real frontend origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_routes.router)
app.include_router(worker_routes.router)
app.include_router(booking_routes.router)
app.include_router(review_routes.router)
app.include_router(message_routes.router)
app.include_router(service_routes.router)
app.include_router(search_routes.router)
app.include_router(upload_routes.router)


@app.on_event("startup")
def on_startup():
    create_indexes()


@app.get("/")
def health_check():
    return {"status": "ok", "service": "hyperlocal-home-services-api"}
