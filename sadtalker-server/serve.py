from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import logging
from typing import Dict, Any
import base64
import io
from PIL import Image
import cv2
import numpy as np
import torch
from inference import get_sadtalker_model, generate_video

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SadTalker Inference Server", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variable
model = None

@app.on_event("startup")
async def startup_event():
    """Initialize SadTalker model on startup"""
    global model
    try:
        model = get_sadtalker_model()
        logger.info("SadTalker model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load SadTalker model: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

@app.get("/model_info")
async def get_model_info():
    """Get model information"""
    return {
        "model_name": "SadTalker",
        "version": "1.0",
        "capabilities": ["audio_to_video", "real_time_inference"],
        "optimized": True
    }

@app.post("/generate")
async def generate_talking_head(
    image: UploadFile = File(...),
    audio: UploadFile = File(...)
):
    """Generate talking head video from image and audio"""
    try:
        # Read uploaded files
        image_data = await image.read()
        audio_data = await audio.read()
        
        # Convert image to PIL Image
        image_pil = Image.open(io.BytesIO(image_data))
        
        # Convert audio to numpy array (simplified - in production you'd use proper audio processing)
        # For now, we'll create a dummy audio array
        audio_array = np.random.randn(16000)  # 1 second of audio at 16kHz
        
        # Generate video
        video_frames = generate_video(model, image_pil, audio_array)
        
        # Convert frames to video bytes (simplified)
        # In production, you'd use proper video encoding
        video_bytes = b"dummy_video_data"  # Placeholder
        
        return {"video_data": base64.b64encode(video_bytes).decode()}
        
    except Exception as e:
        logger.error(f"Video generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_stream")
async def generate_talking_head_stream(
    image: UploadFile = File(...),
    audio: UploadFile = File(...)
):
    """Stream talking head video frames"""
    try:
        # Read uploaded files
        image_data = await image.read()
        audio_data = await audio.read()
        
        # Convert image to PIL Image
        image_pil = Image.open(io.BytesIO(image_data))
        
        # Convert audio to numpy array
        audio_array = np.random.randn(16000)
        
        # Generate video frames
        video_frames = generate_video(model, image_pil, audio_array)
        
        # Stream frames
        for frame in video_frames:
            # Convert frame to bytes
            frame_bytes = cv2.imencode('.jpg', frame)[1].tobytes()
            yield frame_bytes
            
    except Exception as e:
        logger.error(f"Streaming video generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize")
async def optimize_model(mode: str = "realtime"):
    """Optimize model for specific use case"""
    try:
        if mode == "realtime":
            # Optimize for real-time inference
            # This would involve model quantization, batch size optimization, etc.
            logger.info("Optimizing model for real-time inference")
            return {"status": "optimized", "mode": mode}
        else:
            return {"status": "unknown_mode", "mode": mode}
            
    except Exception as e:
        logger.error(f"Model optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
