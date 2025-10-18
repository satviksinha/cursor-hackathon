import asyncio
import json
import logging
from typing import Dict, Any, Optional, AsyncGenerator
from fastapi import WebSocket
import uuid
from datetime import datetime

from rag_service import RAGService
from elevenlabs_service import ElevenLabsService
from supabase_client import SupabaseClient

logger = logging.getLogger(__name__)

class NeuralMarionettePipeline:
    def __init__(
        self,
        rag_service: RAGService,
        elevenlabs_service: ElevenLabsService,
        supabase_client: SupabaseClient
    ):
        self.rag_service = rag_service
        self.elevenlabs_service = elevenlabs_service
        self.supabase_client = supabase_client
        
    async def process_upload(
        self,
        text_file,
        photo_file,
        voice_file,
        auth_user_id: str
    ) -> str:
        """Process uploaded files and create user record"""
        try:
            # Read file contents
            text_data = await text_file.read()
            photo_data = await photo_file.read()
            voice_data = await voice_file.read()
            
            # Decode text data
            text_content = text_data.decode('utf-8')
            
            # Use authenticated user ID
            user_id = auth_user_id
            
            # Check if user already exists
            existing_user = await self.supabase_client.get_user(user_id)
            if not existing_user:
                user_data = {
                    "id": user_id,
                    "status": "uploading",
                    "created_at": datetime.utcnow().isoformat()
                }
                await self.supabase_client.create_user(user_data)
            else:
                # Update existing user status
                await self.supabase_client.update_user(user_id, {"status": "uploading"})
            
            # Only clear existing embeddings if user is re-uploading with new data
            # Check if embeddings exist and if text data has changed
            has_existing_embeddings = await self.supabase_client.has_user_embeddings(user_id)
            if has_existing_embeddings and existing_user:
                # Compare text data to see if it's changed
                existing_text = existing_user.get("text_data", "")
                if existing_text != text_content:
                    logger.info(f"Text data changed for user {user_id}, clearing existing embeddings")
                    await self.supabase_client.clear_user_embeddings(user_id)
                else:
                    logger.info(f"Text data unchanged for user {user_id}, keeping existing embeddings")
            
            # Store training data
            await self.supabase_client.store_training_data(
                user_id=user_id,
                text_data=text_content,
                photo_data=photo_data,
                voice_data=voice_data
            )
            
            return user_id
            
        except Exception as e:
            logger.error(f"Upload processing error: {e}")
            raise
    
    async def process_rag_data(self, user_id: str) -> str:
        """Process user data for RAG: chunk, embed, and store"""
        voice_id = None
        
        try:
            # Get training data
            training_data = await self.supabase_client.get_training_data(user_id)
            if not training_data:
                raise Exception("No training data found")
            
            # Check if embeddings already exist
            has_existing_embeddings = await self.supabase_client.has_user_embeddings(user_id)
            if has_existing_embeddings:
                embedding_count = await self.supabase_client.get_user_embedding_count(user_id)
                logger.info(f"User {user_id} already has {embedding_count} embeddings. Skipping embedding generation.")
            else:
                # Process text data with RAG
                try:
                    logger.info(f"Starting RAG processing for user {user_id}")
                    success = await self.rag_service.process_user_data(user_id, training_data["text_data"])
                except Exception as e:
                    logger.error(f"RAG processing error for user {user_id}: {e}")
                    # Update user status to failed
                    await self.supabase_client.update_user(user_id, {"status": "failed"})
                    raise Exception(f"Failed to process text data: {str(e)}")
                if not success:
                    await self.supabase_client.update_user(user_id, {"status": "failed"})
                    raise Exception("Failed to process text data")
                
                logger.info(f"RAG data processing completed for user {user_id}")
            
            # Try to create voice clone, but don't fail the entire operation if it fails
            try:
                voice_id = await self.elevenlabs_service.clone_voice(
                    audio_file=training_data["voice_data"],
                    name=f"marionette_{user_id}",
                    description=f"Voice clone for user {user_id}"
                )
                logger.info(f"Voice clone created successfully: {voice_id}")
            except Exception as voice_error:
                logger.warning(f"Voice clone failed, but continuing with RAG processing: {voice_error}")
                voice_id = None  # We'll handle this later
            
            # Check if training job already exists
            existing_job = await self.supabase_client.get_user_training_job(user_id)
            
            if existing_job:
                # Update existing job
                await self.supabase_client.update_training_job(existing_job["id"], {
                    "voice_id": voice_id,
                    "status": "succeeded",
                    "updated_at": datetime.utcnow().isoformat()
                })
                job_id = existing_job["openai_job_id"]
            else:
                # Create new job
                job_data = {
                    "openai_job_id": f"rag_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
                    "training_file_id": None,  # Not needed for RAG
                    "voice_id": voice_id,
                    "status": "succeeded",  # RAG processing is instant
                    "created_at": datetime.utcnow().isoformat()
                }
                
                await self.supabase_client.create_training_job(user_id, job_data)
                job_id = job_data["openai_job_id"]
            
            logger.info(f"RAG job record updated/created in database for user {user_id}")
            
            # Update user status to ready
            await self.supabase_client.update_user(user_id, {"status": "ready"})
            
            return job_id
            
        except Exception as e:
            logger.error(f"RAG processing error: {e}")
            raise
    
    async def retry_voice_clone(self, user_id: str) -> str:
        """Retry voice clone creation for a user who has a training job but no voice_id"""
        try:
            # Get user's training job
            job = await self.supabase_client.get_user_training_job(user_id)
            if not job:
                raise Exception("No training job found for user")
            
            if job.get("voice_id"):
                return job["voice_id"]  # Already has voice clone
            
            # Get training data
            training_data = await self.supabase_client.get_training_data(user_id)
            if not training_data or not training_data.get("voice_data"):
                raise Exception("No voice data found for voice cloning")
            
            # Create voice clone
            voice_id = await self.elevenlabs_service.clone_voice(
                audio_file=training_data["voice_data"],
                name=f"marionette_{user_id}_retry",
                description=f"Retry voice clone for user {user_id}"
            )
            
            # Update job with voice_id
            await self.supabase_client.update_training_job(job["id"], {
                "voice_id": voice_id,
                "updated_at": datetime.utcnow().isoformat()
            })
            
            logger.info(f"Voice clone retry successful for user {user_id}: {voice_id}")
            return voice_id
            
        except Exception as e:
            logger.error(f"Voice clone retry failed for user {user_id}: {e}")
            raise
    
    async def get_training_status(self, user_id: str) -> Dict[str, Any]:
        """Get training status for a user (RAG is instant)"""
        try:
            job = await self.supabase_client.get_user_training_job(user_id)
            if not job:
                return {"status": "not_found"}
            
            # For RAG, status is always succeeded since processing is instant
            return {
                "status": "succeeded",
                "model_id": "gpt-4o-mini",  # Using GPT-4o-mini with RAG
                "voice_id": job["voice_id"],
                "progress": 100
            }
            
        except Exception as e:
            logger.error(f"Training status error: {e}")
            raise
    
    def _calculate_progress(self, status: str) -> int:
        """Calculate training progress percentage (RAG is instant)"""
        return 100 if status == "succeeded" else 0
    
    async def process_chat(self, user_id: str, message: str) -> str:
        """Process a chat message and return response using RAG"""
        try:
            # Get user and training job info
            user = await self.supabase_client.get_user(user_id)
            job = await self.supabase_client.get_user_training_job(user_id)
            
            if not user or not job:
                raise Exception("User or training job not found")
            
            if user["status"] != "ready":
                raise Exception("User not ready for chat")
            
            # Generate response using RAG
            response = await self.rag_service.generate_response(user_id, message)
            
            # Store conversation
            await self.supabase_client.store_conversation(user_id, {
                "user_message": message,
                "assistant_response": response,
                "created_at": datetime.utcnow().isoformat()
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Chat processing error: {e}")
            raise
    
    async def process_chat_stream(
        self,
        user_id: str,
        message: str,
        websocket: WebSocket,
        enable_video: bool = True
    ):
        """Process chat message with real-time streaming using RAG"""
        try:
            logger.info(f"WebSocket chat stream started for user {user_id}, enable_video={enable_video}")
            # Get user and training job info
            user = await self.supabase_client.get_user(user_id)
            job = await self.supabase_client.get_user_training_job(user_id)
            
            if not user or not job:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "User or training job not found"
                }))
                return
            
            if user["status"] != "ready":
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "User not ready for chat"
                }))
                return
            
            full_response = ""
            
            # Stream text response using RAG
            async for chunk in self.rag_service.generate_response_stream(user_id, message):
                full_response += chunk
                await websocket.send_text(json.dumps({
                    "type": "text_chunk",
                    "content": chunk
                }))
            
            # Generate audio from response (only if voice_id exists)
            audio_data = None
            if job.get("voice_id"):
                try:
                    logger.info(f"Generating audio for user {user_id} with voice_id: {job['voice_id']}")
                    audio_data = await self.elevenlabs_service.text_to_speech(
                        text=full_response,
                        voice_id=job["voice_id"]
                    )
                    logger.info(f"Audio generation successful for user {user_id}")
                    
                    # Send complete audio file
                    import base64
                    await websocket.send_text(json.dumps({
                        "type": "audio",
                        "data": base64.b64encode(audio_data).decode('utf-8')
                    }))
                    
                except Exception as audio_error:
                    logger.error(f"Audio generation failed for user {user_id}: {audio_error}")
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Audio generation failed: {str(audio_error)}"
                    }))
            else:
                logger.warning(f"No voice_id found for user {user_id}, skipping audio generation")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "No voice clone available. Please retry voice cloning."
                }))
            
            # Note: Video generation removed for now to focus on streaming audio
            # TODO: Re-implement video generation with streaming audio support
            
            # Store conversation
            await self.supabase_client.store_conversation(user_id, {
                "user_message": message,
                "assistant_response": full_response,
                "created_at": datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Streaming chat error: {e}")
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": str(e)
            }))
    
    async def process_chat_stream_debug(self, user_id: str, message: str, enable_video: bool = True) -> dict:
        """Debug version of process_chat_stream that returns results instead of sending via WebSocket"""
        try:
            logger.info(f"Debug: Starting chat stream for user {user_id}, enable_video={enable_video}")
            
            # Get user and training job info
            user = await self.supabase_client.get_user(user_id)
            job = await self.supabase_client.get_user_training_job(user_id)
            
            if not user or not job:
                return {"error": "User or training job not found"}
            
            if user["status"] != "ready":
                return {"error": "User not ready for chat"}
            
            logger.info(f"Debug: User ready, voice_id={job.get('voice_id')}")
            
            full_response = ""
            
            # Stream text response using RAG
            async for chunk in self.rag_service.generate_response_stream(user_id, message):
                full_response += chunk
            
            logger.info(f"Debug: Generated response: '{full_response[:100]}...'")
            
            # Generate audio from response (only if voice_id exists)
            audio_data = None
            if job.get("voice_id"):
                try:
                    logger.info(f"Debug: Generating audio for user {user_id} with voice_id: {job['voice_id']}")
                    audio_data = await self.elevenlabs_service.text_to_speech(
                        text=full_response,
                        voice_id=job["voice_id"]
                    )
                    logger.info(f"Debug: Audio generation successful: {len(audio_data)} bytes")
                except Exception as audio_error:
                    logger.error(f"Debug: Audio generation failed: {audio_error}")
                    return {"error": f"Audio generation failed: {str(audio_error)}"}
            else:
                logger.warning(f"Debug: No voice_id found for user {user_id}")
                return {"error": "No voice clone available"}
            
            # Generate video/audio based on preference
            result = {"text": full_response, "audio_generated": len(audio_data) if audio_data else 0}
            
            # TODO: Re-implement video generation with streaming audio support
            if enable_video:
                logger.info(f"Debug: Video generation requested but not implemented")
                result["video_not_implemented"] = True
            else:
                logger.info(f"Debug: Video disabled, would send audio only")
                result["would_send_audio"] = True
            
            return result
            
        except Exception as e:
            logger.error(f"Debug: Error in chat stream: {e}")
            return {"error": str(e)}
