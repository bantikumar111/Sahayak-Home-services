from fastapi import APIRouter, HTTPException, UploadFile, File
import shutil
import os
import uuid

router = APIRouter(prefix="/upload", tags=["upload"])

@router.post("/image")
def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    
    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)
    
    filepath = os.path.join("uploads", filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/uploads/{filename}"
    
    return {"message": "Image uploaded successfully", "url": image_url}
