"""
Direct mem0 Integration Client
Handles memory operations directly with mem0ai library using MemoryClient
"""

import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import json
from mem0 import MemoryClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

class Mem0Client:
    """Client for direct mem0 memory operations using MemoryClient"""
    
    def __init__(self):
        # Initialize mem0 with MemoryClient (using cloud API)
        self.memory = MemoryClient()
        
    async def add_memory(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Add a memory to mem0 storage
        
        Args:
            content: Memory content to store
            metadata: Optional metadata
            
        Returns:
            Response from mem0
        """
        try:
            # Extract user_id from metadata or use default
            user_id = metadata.get("user_id") if metadata else "default_user"
            
            # Add memory using the correct API format
            messages = [{"role": "user", "content": content}]
            result = self.memory.add(messages, user_id=user_id)
            
            return {
                "success": True,
                "memory_id": result.get("id"),
                "message": "Memory added successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def search_memory(self, query: str, limit: int = 10, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Search memories in mem0 storage
        
        Args:
            query: Search query
            limit: Maximum number of results
            user_id: User ID to search within
            
        Returns:
            Search results
        """
        try:
            # Search memories using the correct API with required filters
            results = self.memory.search(query, user_id=user_id, filters={"user_id": user_id})
            
            return {
                "success": True,
                "memories": results.get("results", [])
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "memories": []
            }
    
    async def get_all_memories(self, user_id: str = "default_user") -> Dict[str, Any]:
        """
        Get all memories for a user
        
        Args:
            user_id: User ID to get memories for
            
        Returns:
            All memories
        """
        try:
            memories = self.memory.get_all(user_id=user_id, filters={"user_id": user_id})
            return {
                "success": True,
                "memories": memories.get("results", [])
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "memories": []
            }


# Global instance
mem0_client = Mem0Client()
