"""
Exa Search Client
Handles search operations with Exa.ai API
"""

import httpx
import os
from typing import Dict, Any, Optional, List

class ExaClient:
    """Client for Exa.ai search operations"""
    
    def __init__(self):
        self.api_key = os.getenv("EXA_API_KEY")
        self.base_url = "https://api.exa.ai"
        
    async def search(self, query: str, num_results: int = 5, search_type: str = "search") -> Dict[str, Any]:
        """
        Perform search using Exa.ai
        
        Args:
            query: Search query
            num_results: Number of results to return
            search_type: Type of search (search, news, research)
            
        Returns:
            Search results
        """
        if not self.api_key:
            return {
                "success": False,
                "error": "EXA_API_KEY not configured",
                "results": []
            }
        
        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key
        }
        
        # Different endpoints for different search types
        endpoint_map = {
            "search": "/search",
            "news": "/search",
            "research": "/search"
        }
        
        endpoint = endpoint_map.get(search_type, "/search")
        
        payload = {
            "query": query,
            "numResults": num_results,
            "type": search_type,
            "useAutoprompt": True
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "success": True,
                    "results": data.get("results", []),
                    "query": query,
                    "search_type": search_type
                }
                
        except httpx.HTTPError as e:
            return {
                "success": False,
                "error": f"HTTP error: {str(e)}",
                "results": []
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Search error: {str(e)}",
                "results": []
            }
    
    async def research_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search for research papers and academic content
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            Research search results
        """
        return await self.search(query, num_results, "research")
    
    async def news_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        Search for news and current events
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            News search results
        """
        return await self.search(query, num_results, "news")
    
    async def general_search(self, query: str, num_results: int = 5) -> Dict[str, Any]:
        """
        General web search
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            General search results
        """
        return await self.search(query, num_results, "search")


# Global instance
exa_client = ExaClient()
