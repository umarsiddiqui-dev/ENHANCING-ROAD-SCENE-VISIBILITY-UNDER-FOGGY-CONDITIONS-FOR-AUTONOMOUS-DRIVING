from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router
import os

app = FastAPI(title="AI Vision Enhancement & Detection Lab", 
              description="Demonstrates image enhancement algorithms and their impact on YOLOv5 object detection.",
              version="1.0.0")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Create a temporary directory for processing if it doesn't exist
os.makedirs("temp", exist_ok=True)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
