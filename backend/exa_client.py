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
        
        # All search types use the same endpoint
        endpoint = "/search"
        
        payload = {
            "query": query,
            "numResults": num_results,
            "type": search_type,
            "text": True
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
    
    async def parallel_search(self, query: str, strategy: str, num_results: int = 3) -> Dict[str, Any]:
        """
        Execute search with specific strategy for parallel processing
        
        Args:
            query: Search query
            strategy: Search strategy (contrarian, academic, calming_content, etc.)
            num_results: Number of results to return
            
        Returns:
            Search results with strategy metadata
        """
        # Modify query based on strategy
        strategy_queries = {
            "contrarian": f"opposing viewpoint alternative perspective {query}",
            "academic": f"research study academic paper {query}",
            "calming_content": f"zen meditation mindfulness stress relief {query}",
            "structured": f"data analysis methodology framework {query}",
            "chaos_challenge": f"creative unconventional innovative {query}",
            "social_trends": f"trending viral social media {query}",
            "community": f"discussion forum community opinion {query}",
            "deep_dive": f"comprehensive analysis detailed explanation {query}"
        }
        
        modified_query = strategy_queries.get(strategy, query)
        
        result = await self.search(modified_query, num_results, "search")
        result["strategy"] = strategy
        result["original_query"] = query
        return result
    
    async def personality_mirror_search(self, query: str, personality_traits: Dict[str, float], num_results: int = 3) -> Dict[str, Any]:
        """
        Find content that matches user's personality profile
        
        Args:
            query: Search query
            personality_traits: User's personality scores
            num_results: Number of results to return
            
        Returns:
            Personality-matched search results
        """
        # Build personality-aware query
        trait_keywords = []
        if personality_traits.get("openness", 0) > 70:
            trait_keywords.extend(["creative", "artistic", "innovative"])
        if personality_traits.get("conscientiousness", 0) > 70:
            trait_keywords.extend(["organized", "systematic", "methodical"])
        if personality_traits.get("extraversion", 0) > 70:
            trait_keywords.extend(["social", "community", "networking"])
        if personality_traits.get("agreeableness", 0) > 70:
            trait_keywords.extend(["collaborative", "supportive", "harmonious"])
        if personality_traits.get("neuroticism", 0) > 70:
            trait_keywords.extend(["mindfulness", "calm", "stress-management"])
        
        personality_query = f"{query} {' '.join(trait_keywords[:3])}"
        result = await self.search(personality_query, num_results, "search")
        result["strategy"] = "personality_mirror"
        result["traits_used"] = trait_keywords[:3]
        return result


# Global instance
exa_client = ExaClient()
