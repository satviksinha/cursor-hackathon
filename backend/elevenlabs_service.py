import os
import requests
import asyncio
import aiohttp
import io
from typing import Optional, AsyncGenerator
import logging
from dotenv import load_dotenv

# Load environment variables from project root
from pathlib import Path
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

class ElevenLabsService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.base_url = "https://api.elevenlabs.io/v1"
        self.headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
    async def health_check(self) -> bool:
        """Check if ElevenLabs service is accessible"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/voices",
                    headers=self.headers
                ) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"ElevenLabs health check failed: {e}")
            return False
    
    async def clone_voice(self, audio_file: bytes, name: str, description: str = "") -> str:
        """Clone voice from audio sample"""
        try:
            # Create a proper multipart form data
            data = aiohttp.FormData()
            data.add_field('files', audio_file, filename='audio.wav', content_type='audio/wav')
            data.add_field('name', name)
            data.add_field('description', description)
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/voices/add",
                    headers={"xi-api-key": self.api_key},
                    data=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result["voice_id"]
                    else:
                        error_text = await response.text()
                        raise Exception(f"Voice cloning failed: {error_text}")
                        
        except Exception as e:
            logger.error(f"Voice cloning error: {e}")
            raise
    
    async def text_to_speech(self, text: str, voice_id: str) -> bytes:
        """Convert text to speech using cloned voice"""
        try:
            data = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers=self.headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        error_text = await response.text()
                        raise Exception(f"TTS failed: {error_text}")
                        
        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise
    
    async def text_to_speech_stream(self, text: str, voice_id: str) -> AsyncGenerator[bytes, None]:
        """Stream text to speech for real-time generation"""
        try:
            data = {
                "text": text,
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.5,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/text-to-speech/{voice_id}/stream",
                    headers=self.headers,
                    json=data
                ) as response:
                    if response.status == 200:
                        async for chunk in response.content.iter_chunked(1024):
                            yield chunk
                    else:
                        error_text = await response.text()
                        raise Exception(f"Streaming TTS failed: {error_text}")
                        
        except Exception as e:
            logger.error(f"Streaming TTS error: {e}")
            raise
    
