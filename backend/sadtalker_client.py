import os
import aiohttp
import asyncio
import base64
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

class SadTalkerClient:
    def __init__(self):
        self.base_url = os.getenv("SADTALKER_URL", "http://localhost:8001")
        self.timeout = 30
        
    async def health_check(self) -> bool:
        """Check if SadTalker service is accessible"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/health",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    return response.status == 200
        except Exception as e:
            logger.error(f"SadTalker health check failed: {e}")
            return False
    
    async def generate_video(self, image_data: bytes, audio_data: bytes) -> bytes:
        """Generate talking head video from image and audio"""
        try:
            # Prepare multipart form data
            data = aiohttp.FormData()
            data.add_field('image', image_data, filename='image.jpg', content_type='image/jpeg')
            data.add_field('audio', audio_data, filename='audio.wav', content_type='audio/wav')
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/generate",
                    data=data,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        error_text = await response.text()
                        raise Exception(f"Video generation failed: {error_text}")
                        
        except Exception as e:
            logger.error(f"Video generation error: {e}")
            raise
    
    async def generate_video_stream(self, image_data: bytes, audio_data: bytes) -> AsyncGenerator[bytes, None]:
        """Stream video frames for real-time generation"""
        try:
            # Prepare multipart form data
            data = aiohttp.FormData()
            data.add_field('image', image_data, filename='image.jpg', content_type='image/jpeg')
            data.add_field('audio', audio_data, filename='audio.wav', content_type='audio/wav')
            data.add_field('stream', 'true')  # Enable streaming mode
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/generate_stream",
                    data=data,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as response:
                    if response.status == 200:
                        async for chunk in response.content.iter_chunked(1024):
                            yield chunk
                    else:
                        error_text = await response.text()
                        raise Exception(f"Streaming video generation failed: {error_text}")
                        
        except Exception as e:
            logger.error(f"Streaming video generation error: {e}")
            raise
    
    async def get_model_info(self) -> dict:
        """Get information about the SadTalker model"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.base_url}/model_info",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_text = await response.text()
                        raise Exception(f"Failed to get model info: {error_text}")
                        
        except Exception as e:
            logger.error(f"Get model info error: {e}")
            raise
    
    async def optimize_for_realtime(self) -> bool:
        """Optimize SadTalker for real-time inference"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.base_url}/optimize",
                    json={"mode": "realtime"},
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    return response.status == 200
                    
        except Exception as e:
            logger.error(f"Optimization error: {e}")
            return False
