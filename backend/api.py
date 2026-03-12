import os
import cv2
import uuid
import zipfile
import shutil
import base64
from typing import List, Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
import numpy as np

# Import our custom modules
from enhancement import process_all_enhancements
from detection import detect_objects

router = APIRouter()
TEMP_DIR = "temp"

def save_upload_file_tmp(upload_file: UploadFile) -> str:
    try:
        suffix = os.path.splitext(upload_file.filename)[1]
        temp_file_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}{suffix}")
        with open(temp_file_path, "wb") as f:
            shutil.copyfileobj(upload_file.file, f)
        return temp_file_path
    finally:
        upload_file.file.close()

def encode_image(img):
    _, buffer = cv2.imencode('.jpg', img)
    return base64.b64encode(buffer).decode('utf-8')

@router.post("/process")
async def process_images(
    files: List[UploadFile] = File(...),
    clahe_clip: float = Form(2.0),
    gamma_val: float = Form(1.5),
    bilateral_d: int = Form(9),
    dark_window: int = Form(15)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
        
    results = []
    
    params = {
        "clahe_clip": clahe_clip,
        "gamma_val": gamma_val,
        "bilateral_d": bilateral_d,
        "dark_window": dark_window
    }
    
    batch_id = str(uuid.uuid4())
    batch_dir = os.path.join(TEMP_DIR, batch_id)
    os.makedirs(batch_dir, exist_ok=True)
    
    for file in files:
        # Read file into memory
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            continue
            
        file_id = str(uuid.uuid4())
        
        # 1. Enhance
        enhanced_dict = process_all_enhancements(img, params)
        
        # 2. Detect & Collect Results
        image_results = {
            "filename": file.filename,
            "id": file_id,
            "methods": {}
        }
        
        for method_name, enc_img in enhanced_dict.items():
            # Detect objects
            annotated_img, count, conf = detect_objects(enc_img)
            
            # Save to disk for ZIP download later
            save_path = os.path.join(batch_dir, f"{file_id}_{method_name}.jpg")
            cv2.imwrite(save_path, annotated_img)
            
            # Encode to base64 for immediate frontend display
            image_results["methods"][method_name] = {
                "image": f"data:image/jpeg;base64,{encode_image(annotated_img)}",
                "objects": count,
                "confidence": conf
            }
            
        results.append(image_results)
        
    return JSONResponse({
        "batch_id": batch_id,
        "results": results
    })

@router.get("/download/{batch_id}")
async def download_results(batch_id: str):
    batch_dir = os.path.join(TEMP_DIR, batch_id)
    if not os.path.exists(batch_dir):
        raise HTTPException(status_code=404, detail="Batch not found")
        
    zip_filename = os.path.join(TEMP_DIR, f"results_{batch_id}.zip")
    
    # Create zip file
    with zipfile.ZipFile(zip_filename, 'w') as zipf:
        for root, _, files in os.walk(batch_dir):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, arcname=file)
                
    return FileResponse(
        zip_filename, 
        media_type="application/zip", 
        filename=f"enhancement_results.zip"
    )
