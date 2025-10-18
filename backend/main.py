from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
import asyncio
import json
from typing import Dict, List, Optional
import logging
from auth import get_user_id_from_token
import time
from datetime import datetime

# Load environment variables from project root
import os
from pathlib import Path
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

# Import our services
from rag_service import RAGService
from elevenlabs_service import ElevenLabsService
from sadtalker_client import SadTalkerClient
from pipeline import NeuralMarionettePipeline
from supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models
class ChatMessage(BaseModel):
    message: str

app = FastAPI(title="Neural Marionette API", version="1.0.0")

# CORS middleware (add first)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"Request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        logger.info(f"Response: {response.status_code} - {process_time:.4f}s")
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {str(e)} - {process_time:.4f}s", exc_info=True)
        raise

# Initialize services
supabase_client = SupabaseClient()
rag_service = RAGService(supabase_client)
elevenlabs_service = ElevenLabsService()
sadtalker_client = SadTalkerClient()
pipeline = NeuralMarionettePipeline(
    rag_service=rag_service,
    elevenlabs_service=elevenlabs_service,
    sadtalker_client=sadtalker_client,
    supabase_client=supabase_client
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.get("/")
async def root():
    return {"message": "Neural Marionette API is running"}

@app.post("/api/upload")
async def upload_data(
    text_file: UploadFile = File(...),
    photo_file: UploadFile = File(...),
    voice_file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload user data for marionette creation"""
    try:
        logger.info("Upload endpoint called")
        logger.info(f"Authorization header: {authorization}")
        logger.info(f"Text file: {text_file.filename}, size: {text_file.size}")
        logger.info(f"Photo file: {photo_file.filename}, size: {photo_file.size}")
        logger.info(f"Voice file: {voice_file.filename}, size: {voice_file.size}")
        
        # Get authenticated user ID
        auth_user_id = get_user_id_from_token(authorization)
        logger.info(f"Authenticated user ID: {auth_user_id}")
        
        # Process uploaded files
        user_id = await pipeline.process_upload(
            text_file=text_file,
            photo_file=photo_file,
            voice_file=voice_file,
            auth_user_id=auth_user_id
        )
        
        # Automatically start RAG processing after successful upload
        try:
            job_id = await pipeline.process_rag_data(user_id)
            logger.info(f"RAG processing completed automatically, job_id: {job_id}")
            return {"user_id": user_id, "status": "ready", "job_id": job_id}
        except Exception as processing_error:
            logger.error(f"Failed to process data automatically: {processing_error}")
            # Return upload success but processing failure
            return {"user_id": user_id, "status": "uploaded", "processing_error": str(processing_error)}
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/train/{user_id}")
async def start_training(user_id: str):
    """Start RAG processing for a user"""
    try:
        # Check if user exists and has training data
        user = await supabase_client.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if not user.get("text_data"):
            raise HTTPException(status_code=400, detail="No training data found. Please upload data first.")
        
        # Check if processing is already complete
        existing_job = await supabase_client.get_user_training_job(user_id)
        if existing_job and existing_job.get("status") == "succeeded":
            return {
                "job_id": existing_job["openai_job_id"],
                "status": "already_ready",
                "message": "RAG processing already completed"
            }
        
        job_id = await pipeline.process_rag_data(user_id)
        return {"job_id": job_id, "status": "ready"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/train/{user_id}/status")
async def get_training_status(user_id: str):
    """Get RAG processing status"""
    try:
        status = await pipeline.get_training_status(user_id)
        return status
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/user/{user_id}/status")
async def get_user_status(user_id: str):
    """Get comprehensive user and training status"""
    try:
        # Get user data
        user = await supabase_client.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get training job if exists
        training_job = await supabase_client.get_user_training_job(user_id)
        
        response = {
            "user_id": user_id,
            "user_status": user.get("status", "unknown"),
            "created_at": user.get("created_at"),
            "updated_at": user.get("updated_at"),
            "model_id": user.get("model_id"),
            "has_training_data": bool(user.get("text_data")),
            "has_photo": bool(user.get("photo_path")),
            "has_voice": bool(user.get("voice_path"))
        }
        
        if training_job:
            # For RAG, status is always succeeded since processing is instant
            response.update({
                "training_job_id": training_job["id"],
                "openai_job_id": training_job["openai_job_id"],
                "training_status": "succeeded",
                "training_progress": 100,
                "voice_id": training_job.get("voice_id"),
                "training_created_at": training_job.get("created_at"),
                "training_updated_at": training_job.get("updated_at"),
                "model": "gpt-4o-mini"
            })
        else:
            response.update({
                "training_status": "not_started",
                "training_progress": 0,
                "message": "No RAG processing job found. Processing may not have been started yet."
            })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User status check error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/{user_id}")
async def chat(user_id: str, chat_message: ChatMessage):
    """Send a message to the marionette"""
    try:
        response = await pipeline.process_chat(user_id, chat_message.message)
        return {"response": response}
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time video streaming"""
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "chat":
                # Process chat message and stream response
                enable_video = message_data.get("enableVideo", True)  # Default to True for backward compatibility
                await pipeline.process_chat_stream(
                    user_id=user_id,
                    message=message_data["message"],
                    websocket=websocket,
                    enable_video=enable_video
                )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "rag": await rag_service.health_check(),
            "elevenlabs": await elevenlabs_service.health_check(),
            "sadtalker": await sadtalker_client.health_check(),
            "supabase": await supabase_client.health_check()
        }
    }

@app.post("/api/train/{user_id}/retry-voice")
async def retry_voice_clone(user_id: str):
    """Retry voice clone creation for a user"""
    try:
        voice_id = await pipeline.retry_voice_clone(user_id)
        return {
            "status": "success",
            "voice_id": voice_id,
            "message": "Voice clone created successfully"
        }
    except Exception as e:
        logger.error(f"Voice clone retry error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/circuit-breaker/status")
async def get_circuit_breaker_status():
    """Get current circuit breaker status"""
    try:
        status = rag_service.get_circuit_breaker_status()
        return {
            "status": "success",
            "circuit_breaker": status
        }
    except Exception as e:
        logger.error(f"Circuit breaker status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/circuit-breaker/reset")
async def reset_circuit_breaker():
    """Reset the circuit breaker"""
    try:
        rag_service.reset_circuit_breaker()
        return {
            "status": "success",
            "message": "Circuit breaker reset successfully"
        }
    except Exception as e:
        logger.error(f"Circuit breaker reset error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/debug/websocket-test/{user_id}")
async def debug_websocket_test(user_id: str, request: dict):
    """Debug endpoint to test WebSocket functionality"""
    try:
        message = request.get("message", "Hello test")
        enable_video = request.get("enableVideo", False)
        
        logger.info(f"Debug WebSocket test for user {user_id}: message='{message}', enable_video={enable_video}")
        
        # Test the pipeline directly
        result = await pipeline.process_chat_stream_debug(user_id, message, enable_video)
        
        return {
            "status": "success",
            "result": result,
            "message": "Debug test completed"
        }
    except Exception as e:
        logger.error(f"Debug WebSocket test error: {str(e)}")
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
