"""
Auth + user profile routes.

Flow:
1. POST /users/register           -> create user record (if new)
2. POST /users/login/request-otp  -> generates + "sends" (prints) a mock OTP
3. POST /users/login/verify-otp   -> verifies OTP, returns a JWT + user profile
4. GET  /users/profile/{user_id}  -> fetch a user's profile
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
import shutil
import os
import uuid
from app.config.db import users_col
from app.models.user import UserRegister, LoginRequest, UserUpdate
from app.services.auth_service import get_password_hash, verify_password, create_access_token
from app.utils.helpers import now_utc, to_object_id, serialize_doc

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/register")
def register_user(payload: UserRegister):
    existing = users_col.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered. Please login instead.")

    doc = {
        "name": payload.name,
        "email": payload.email,
        "password_hash": get_password_hash(payload.password),
        "role": "user",
        "address": payload.address,
        "location": (
            {"type": "Point", "coordinates": [payload.location.lng, payload.location.lat]}
            if payload.location else None
        ),
        "created_at": now_utc(),
    }
    result = users_col.insert_one(doc)
    return {"message": "User registered", "user_id": str(result.inserted_id)}


@router.post("/login")
def login(payload: LoginRequest):
    user = users_col.find_one({"email": payload.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid password")

    token = create_access_token(subject=str(user["_id"]), role="user")
    
    # Don't send password hash to the frontend
    user.pop("password_hash", None)
    
    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": serialize_doc(user),
    }


@router.get("/profile/{user_id}")
def get_profile(user_id: str):
    user = users_col.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return serialize_doc(user)

@router.patch("/{user_id}")
def update_user_profile(user_id: str, payload: UserUpdate):
    update_data = {}
    if payload.address is not None:
        update_data["address"] = payload.address
        
    if not update_data:
        return {"message": "No changes requested"}
        
    result = users_col.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Profile updated successfully"}

@router.post("/{user_id}/avatar")
def upload_user_avatar(user_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    avatar_url = f"/uploads/{filename}"
    
    result = users_col.update_one(
        {"_id": to_object_id(user_id)},
        {"$set": {"avatar": avatar_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"message": "Avatar updated", "avatar_url": avatar_url}
