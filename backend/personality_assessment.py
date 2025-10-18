"""
Big Five Personality Assessment System
Implements OCEAN (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) questionnaire
"""

from typing import Dict, List, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import json


@dataclass
class PersonalityProfile:
    """Represents a user's Big Five personality profile"""
    user_id: str
    openness: float  # 0-100
    conscientiousness: float  # 0-100
    extraversion: float  # 0-100
    agreeableness: float  # 0-100
    neuroticism: float  # 0-100
    timestamp: str
    raw_scores: Dict[str, List[int]]  # Store individual question scores for analysis
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage"""
        return {
            "user_id": self.user_id,
            "profile": {
                "openness": self.openness,
                "conscientiousness": self.conscientiousness,
                "extraversion": self.extraversion,
                "agreeableness": self.agreeableness,
                "neuroticism": self.neuroticism
            },
            "timestamp": self.timestamp,
            "raw_scores": self.raw_scores
        }
    
    def get_trait_description(self, trait: str) -> str:
        """Get human-readable description of trait level"""
        value = getattr(self, trait)
        
        descriptions = {
            "openness": {
                "high": "Highly open to new experiences, creative, and curious",
                "medium": "Moderately open to new experiences",
                "low": "Prefers familiar routines and conventional approaches"
            },
            "conscientiousness": {
                "high": "Highly organized, disciplined, and goal-oriented",
                "medium": "Moderately organized and reliable",
                "low": "Flexible and spontaneous, less focused on details"
            },
            "extraversion": {
                "high": "Highly outgoing, social, and energetic",
                "medium": "Moderately social and outgoing",
                "low": "More reserved, prefers smaller groups or solitude"
            },
            "agreeableness": {
                "high": "Highly cooperative, trusting, and empathetic",
                "medium": "Moderately cooperative and trusting",
                "low": "More competitive and skeptical, values independence"
            },
            "neuroticism": {
                "high": "More sensitive to stress and emotional volatility",
                "medium": "Moderately emotionally stable",
                "low": "Highly emotionally stable and resilient"
            }
        }
        
        if value >= 70:
            level = "high"
        elif value >= 30:
            level = "medium"
        else:
            level = "low"
            
        return descriptions[trait][level]


class BigFiveAssessment:
    """Big Five personality assessment questionnaire"""
    
    def __init__(self):
        self.questions = self._load_questions()
    
    def _load_questions(self) -> List[Dict[str, Any]]:
        """Load Big Five questionnaire questions"""
        return [
            # Openness questions
            {
                "id": "o1",
                "dimension": "openness",
                "text": "I enjoy exploring new ideas and concepts",
                "reverse": False
            },
            {
                "id": "o2", 
                "dimension": "openness",
                "text": "I prefer routine and familiar activities",
                "reverse": True
            },
            {
                "id": "o3",
                "dimension": "openness", 
                "text": "I appreciate art, music, and creative expression",
                "reverse": False
            },
            {
                "id": "o4",
                "dimension": "openness",
                "text": "I like to think about abstract concepts",
                "reverse": False
            },
            
            # Conscientiousness questions
            {
                "id": "c1",
                "dimension": "conscientiousness",
                "text": "I always complete tasks on time",
                "reverse": False
            },
            {
                "id": "c2",
                "dimension": "conscientiousness", 
                "text": "I prefer to plan things out in detail",
                "reverse": False
            },
            {
                "id": "c3",
                "dimension": "conscientiousness",
                "text": "I often procrastinate on important tasks",
                "reverse": True
            },
            {
                "id": "c4",
                "dimension": "conscientiousness",
                "text": "I keep my workspace organized",
                "reverse": False
            },
            
            # Extraversion questions
            {
                "id": "e1",
                "dimension": "extraversion",
                "text": "I feel energized in large social gatherings",
                "reverse": False
            },
            {
                "id": "e2",
                "dimension": "extraversion",
                "text": "I prefer quiet evenings at home",
                "reverse": True
            },
            {
                "id": "e3",
                "dimension": "extraversion",
                "text": "I enjoy being the center of attention",
                "reverse": False
            },
            {
                "id": "e4",
                "dimension": "extraversion",
                "text": "I find it easy to start conversations with strangers",
                "reverse": False
            },
            
            # Agreeableness questions
            {
                "id": "a1",
                "dimension": "agreeableness",
                "text": "I trust people easily",
                "reverse": False
            },
            {
                "id": "a2",
                "dimension": "agreeableness",
                "text": "I often put others' needs before my own",
                "reverse": False
            },
            {
                "id": "a3",
                "dimension": "agreeableness",
                "text": "I enjoy competitive situations",
                "reverse": True
            },
            {
                "id": "a4",
                "dimension": "agreeableness",
                "text": "I try to avoid conflicts",
                "reverse": False
            },
            
            # Neuroticism questions
            {
                "id": "n1",
                "dimension": "neuroticism",
                "text": "I worry about things that might go wrong",
                "reverse": False
            },
            {
                "id": "n2",
                "dimension": "neuroticism",
                "text": "I remain calm under pressure",
                "reverse": True
            },
            {
                "id": "n3",
                "dimension": "neuroticism",
                "text": "I often feel anxious or stressed",
                "reverse": False
            },
            {
                "id": "n4",
                "dimension": "neuroticism",
                "text": "I handle criticism well",
                "reverse": True
            }
        ]
    
    def get_questions(self) -> List[Dict[str, Any]]:
        """Get all questionnaire questions"""
        return self.questions
    
    def calculate_scores(self, answers: Dict[str, int]) -> PersonalityProfile:
        """
        Calculate Big Five scores from questionnaire answers
        
        Args:
            answers: Dict mapping question_id to score (1-5)
            
        Returns:
            PersonalityProfile object
        """
        # Initialize raw scores for each dimension
        raw_scores = {
            "openness": [],
            "conscientiousness": [],
            "extraversion": [],
            "agreeableness": [],
            "neuroticism": []
        }
        
        # Process each answer
        for question_id, score in answers.items():
            question = self.get_question_by_id(question_id)
            dimension = question["dimension"]
            
            # Apply reverse scoring if needed
            if question["reverse"]:
                adjusted_score = 6 - score  # Reverse 1-5 scale
            else:
                adjusted_score = score
                
            raw_scores[dimension].append(adjusted_score)
        
        # Calculate dimension scores (average * 25 to get 0-100 scale)
        dimension_scores = {}
        for dimension, scores in raw_scores.items():
            if scores:  # Only calculate if we have answers
                avg_score = sum(scores) / len(scores)
                dimension_scores[dimension] = avg_score * 25  # Scale to 0-100
            else:
                dimension_scores[dimension] = 50.0  # Default to middle if no answers
        
        # Create profile
        profile = PersonalityProfile(
            user_id="",  # Will be set by caller
            openness=dimension_scores["openness"],
            conscientiousness=dimension_scores["conscientiousness"],
            extraversion=dimension_scores["extraversion"],
            agreeableness=dimension_scores["agreeableness"],
            neuroticism=dimension_scores["neuroticism"],
            timestamp=datetime.now().isoformat(),
            raw_scores=raw_scores
        )
        
        return profile
    
    def get_personality_insights(self, profile: PersonalityProfile) -> Dict[str, Any]:
        """
        Generate insights and recommendations based on personality profile
        
        Args:
            profile: PersonalityProfile object
            
        Returns:
            Dictionary with insights and recommendations
        """
        insights = {
            "primary_traits": [],
            "secondary_traits": [],
            "recommendations": [],
            "content_preferences": []
        }
        
        # Identify primary traits (highest scores)
        trait_scores = [
            ("openness", profile.openness),
            ("conscientiousness", profile.conscientiousness),
            ("extraversion", profile.extraversion),
            ("agreeableness", profile.agreeableness),
            ("neuroticism", profile.neuroticism)
        ]
        
        # Sort by score
        trait_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Primary traits (top 2)
        insights["primary_traits"] = [
            {"trait": trait_scores[0][0], "score": trait_scores[0][1]},
            {"trait": trait_scores[1][0], "score": trait_scores[1][1]}
        ]
        
        # Secondary traits (remaining)
        insights["secondary_traits"] = [
            {"trait": trait_scores[2][0], "score": trait_scores[2][1]},
            {"trait": trait_scores[3][0], "score": trait_scores[3][1]},
            {"trait": trait_scores[4][0], "score": trait_scores[4][1]}
        ]
        
        # Generate content preferences based on traits
        if profile.openness >= 70:
            insights["content_preferences"].append("Academic papers and research")
            insights["content_preferences"].append("Creative and artistic content")
            insights["content_preferences"].append("Novel and unconventional ideas")
        
        if profile.extraversion >= 70:
            insights["content_preferences"].append("Social and trending topics")
            insights["content_preferences"].append("Community discussions")
            insights["content_preferences"].append("Popular culture and entertainment")
        
        if profile.conscientiousness >= 70:
            insights["content_preferences"].append("Detailed guides and tutorials")
            insights["content_preferences"].append("Structured and organized content")
            insights["content_preferences"].append("Productivity and efficiency tips")
        
        if profile.agreeableness >= 70:
            insights["content_preferences"].append("Collaborative and team-focused content")
            insights["content_preferences"].append("Social causes and community topics")
        
        if profile.neuroticism <= 30:
            insights["content_preferences"].append("Calm and stress-reducing content")
            insights["content_preferences"].append("Meditation and mindfulness topics")
        
        return insights


# Global instance
big_five_assessment = BigFiveAssessment()
