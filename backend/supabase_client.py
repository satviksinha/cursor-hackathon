import os
from supabase import create_client, Client
import asyncio
from typing import Optional, Dict, Any
import logging
from dotenv import load_dotenv

# Load environment variables from project root
from pathlib import Path
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        # Use service role key for backend operations to bypass RLS
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not self.key:
            # Fallback to anon key if service role key not available
            self.key = os.getenv("SUPABASE_ANON_KEY")
        self.client: Client = create_client(self.url, self.key)
        
    async def health_check(self) -> bool:
        """Check if Supabase is accessible"""
        try:
            # Simple query to test connection
            result = self.client.table("users").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False
    
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Create a new user record"""
        try:
            result = self.client.table("users").insert(user_data).execute()
            return result.data[0]["id"]
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            raise
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data by ID"""
        try:
            result = self.client.table("users").select("*").eq("id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get user: {e}")
            return None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user data"""
        try:
            result = self.client.table("users").update(updates).eq("id", user_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to update user: {e}")
            return False
    
    async def store_training_data(self, user_id: str, text_data: str, photo_data: bytes, voice_data: bytes) -> bool:
        """Store user's training data"""
        try:
            # Upload files to Supabase storage
            photo_path = f"users/{user_id}/photo.jpg"
            voice_path = f"users/{user_id}/voice.wav"
            
            # Upload photo
            self.client.storage.from_("training-data").upload(photo_path, photo_data)
            
            # Upload voice
            self.client.storage.from_("training-data").upload(voice_path, voice_data)
            
            # Update user record with file paths
            await self.update_user(user_id, {
                "photo_path": photo_path,
                "voice_path": voice_path,
                "text_data": text_data,
                "status": "data_uploaded"
            })
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to store training data: {e}")
            return False
    
    async def create_training_job(self, user_id: str, job_data: Dict[str, Any]) -> str:
        """Create a training job record"""
        try:
            job_data["user_id"] = user_id
            result = self.client.table("training_jobs").insert(job_data).execute()
            return result.data[0]["id"]
        except Exception as e:
            logger.error(f"Failed to create training job: {e}")
            raise
    
    async def update_training_job(self, job_id: str, updates: Dict[str, Any]) -> bool:
        """Update training job status"""
        try:
            result = self.client.table("training_jobs").update(updates).eq("id", job_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to update training job: {e}")
            return False
    
    async def get_training_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get training job by ID"""
        try:
            result = self.client.table("training_jobs").select("*").eq("id", job_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get training job: {e}")
            return None
    
    async def get_user_training_job(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get latest training job for a user"""
        try:
            result = self.client.table("training_jobs").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get user training job: {e}")
            return None
    
    async def store_conversation(self, user_id: str, conversation_data: Dict[str, Any]) -> str:
        """Store conversation history"""
        try:
            conversation_data["user_id"] = user_id
            result = self.client.table("conversations").insert(conversation_data).execute()
            return result.data[0]["id"]
        except Exception as e:
            logger.error(f"Failed to store conversation: {e}")
            raise
    
    async def get_conversation_history(self, user_id: str, limit: int = 50) -> list:
        """Get conversation history for a user"""
        try:
            result = self.client.table("conversations").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get conversation history: {e}")
            return []
    
    async def get_training_data(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's training data"""
        try:
            user = await self.get_user(user_id)
            if not user:
                return None
            
            # Download files from storage
            photo_data = self.client.storage.from_("training-data").download(user["photo_path"])
            voice_data = self.client.storage.from_("training-data").download(user["voice_path"])
            
            return {
                "text_data": user["text_data"],
                "photo_data": photo_data,
                "voice_data": voice_data
            }
            
        except Exception as e:
            logger.error(f"Failed to get training data: {e}")
            return None
    
    async def clear_user_embeddings(self, user_id: str) -> bool:
        """Clear all embeddings for a user"""
        try:
            result = self.client.table("text_embeddings").delete().eq("user_id", user_id).execute()
            logger.info(f"Cleared {len(result.data) if result.data else 0} embeddings for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to clear embeddings for user {user_id}: {e}")
            return False
    
    async def has_user_embeddings(self, user_id: str) -> bool:
        """Check if user already has embeddings in the database"""
        try:
            result = self.client.table("text_embeddings").select("id").eq("user_id", user_id).limit(1).execute()
            has_embeddings = len(result.data) > 0
            logger.info(f"User {user_id} has embeddings: {has_embeddings}")
            return has_embeddings
        except Exception as e:
            logger.error(f"Failed to check embeddings for user {user_id}: {e}")
            return False
    
    async def get_user_embedding_count(self, user_id: str) -> int:
        """Get count of embeddings for a user"""
        try:
            result = self.client.table("text_embeddings").select("id", count="exact").eq("user_id", user_id).execute()
            count = result.count if result.count is not None else 0
            logger.info(f"User {user_id} has {count} embeddings")
            return count
        except Exception as e:
            logger.error(f"Failed to get embedding count for user {user_id}: {e}")
            return 0