from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv
import asyncio
import json
from typing import Dict, List, Optional, Any
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
from mem0_client import mem0_client
from exa_client import exa_client
from personality_assessment import big_five_assessment, PersonalityProfile

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models
class ChatMessage(BaseModel):
    message: str

class QuestionnaireAnswer(BaseModel):
    question_id: str
    score: int  # 1-5 scale

class QuestionnaireResponse(BaseModel):
    answers: List[QuestionnaireAnswer]

class PersonalityInsights(BaseModel):
    primary_traits: List[Dict[str, Any]]
    secondary_traits: List[Dict[str, Any]]
    recommendations: List[str]
    content_preferences: List[str]

class PersonalizedChatMessage(BaseModel):
    message: str
    include_search: bool = True

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

# Personality Assessment Endpoints

@app.get("/api/personality/questionnaire")
async def get_questionnaire():
    """Get Big Five personality questionnaire questions"""
    try:
        questions = big_five_assessment.get_questions()
        return {
            "status": "success",
            "questions": questions,
            "total_questions": len(questions)
        }
    except Exception as e:
        logger.error(f"Questionnaire error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/personality/assess/{user_id}")
async def assess_personality(user_id: str, response: QuestionnaireResponse):
    """Process personality questionnaire answers and store profile"""
    try:
        # Convert answers to dict format
        answers_dict = {answer.question_id: answer.score for answer in response.answers}
        
        # Calculate personality profile
        profile = big_five_assessment.calculate_scores(answers_dict)
        profile.user_id = user_id
        
        # Store profile in mem0 directly
        profile_data = profile.to_dict()
        memory_result = await mem0_client.add_memory(
            content=f"User {user_id} personality: Openness {profile.openness}%, Conscientiousness {profile.conscientiousness}%, Extraversion {profile.extraversion}%, Agreeableness {profile.agreeableness}%, Neuroticism {profile.neuroticism}%. Full data: {json.dumps(profile_data)}",
            metadata={
                "category": "personality_profile",
                "user_id": user_id,
                "timestamp": profile.timestamp
            }
        )
        
        # Generate insights
        insights = big_five_assessment.get_personality_insights(profile)
        
        return {
            "status": "success",
            "profile": profile_data,
            "insights": insights,
            "memory_stored": memory_result.get("success", False)
        }
    except Exception as e:
        logger.error(f"Personality assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/personality/profile/{user_id}")
async def get_personality_profile(user_id: str):
    """Get user's personality profile from memory"""
    try:
        # Search for user's personality profile in mem0
        logger.info(f"Searching for personality profile for user: {user_id}")
        search_result = await mem0_client.search_memory(
            query=f"{user_id} Openness Conscientiousness Extraversion Agreeableness Neuroticism",
            limit=10,
            user_id=user_id
        )
        
        logger.info(f"Search result: {search_result}")
        
        if not search_result.get("memories"):
            logger.warning(f"No memories found for user {user_id}")
            raise HTTPException(status_code=404, detail="Personality profile not found")
        
        # Parse the stored profile from memory
        profile_data = {}
        for memory in search_result["memories"]:
            memory_content = memory.get("memory", "")
            
            # Handle individual trait memories
            if "Openness is" in memory_content:
                try:
                    openness_str = memory_content.split("Openness is ")[1].strip()
                    profile_data["openness"] = float(openness_str)
                except (IndexError, ValueError):
                    pass
            elif "Conscientiousness is" in memory_content:
                try:
                    conscientiousness_str = memory_content.split("Conscientiousness is ")[1].strip()
                    profile_data["conscientiousness"] = float(conscientiousness_str)
                except (IndexError, ValueError):
                    pass
            elif "Extraversion is" in memory_content:
                try:
                    extraversion_str = memory_content.split("Extraversion is ")[1].strip()
                    profile_data["extraversion"] = float(extraversion_str)
                except (IndexError, ValueError):
                    pass
            elif "Agreeableness is" in memory_content:
                try:
                    agreeableness_str = memory_content.split("Agreeableness is ")[1].strip()
                    profile_data["agreeableness"] = float(agreeableness_str)
                except (IndexError, ValueError):
                    pass
            elif "Neuroticism" in memory_content and "%" in memory_content:
                try:
                    neuroticism_str = memory_content.split("Neuroticism ")[1].split("%")[0].strip()
                    profile_data["neuroticism"] = float(neuroticism_str)
                except (IndexError, ValueError):
                    pass
        
        if not profile_data:
            raise HTTPException(status_code=404, detail="Personality profile not found")
        
        # Create PersonalityProfile object
        profile = PersonalityProfile(
            user_id=user_id,
            openness=profile_data.get("openness", 0),
            conscientiousness=profile_data.get("conscientiousness", 0),
            extraversion=profile_data.get("extraversion", 0),
            agreeableness=profile_data.get("agreeableness", 0),
            neuroticism=profile_data.get("neuroticism", 0),
            timestamp=datetime.now().isoformat(),
            raw_scores={}
        )
        
        return {
            "status": "success",
            "profile": profile.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get personality profile error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/personalized/{user_id}")
async def personalized_chat(user_id: str, chat_message: PersonalizedChatMessage):
    """Send a personalized chat message based on user's personality profile"""
    try:
        # First, get user's personality profile
        profile_result = await mem0_client.search_memory(
            query=f"{user_id} Openness Conscientiousness Extraversion Agreeableness Neuroticism",
            limit=10,
            user_id=user_id
        )
        
        personality_context = ""
        if profile_result.get("memories"):
            # Parse personality data from memory
            profile_data = {}
            for memory in profile_result["memories"]:
                memory_content = memory.get("memory", "")
                
                # Handle individual trait memories
                if "Openness is" in memory_content:
                    try:
                        openness_str = memory_content.split("Openness is ")[1].strip()
                        profile_data["openness"] = float(openness_str)
                    except (IndexError, ValueError):
                        pass
                elif "Conscientiousness is" in memory_content:
                    try:
                        conscientiousness_str = memory_content.split("Conscientiousness is ")[1].strip()
                        profile_data["conscientiousness"] = float(conscientiousness_str)
                    except (IndexError, ValueError):
                        pass
                elif "Extraversion is" in memory_content:
                    try:
                        extraversion_str = memory_content.split("Extraversion is ")[1].strip()
                        profile_data["extraversion"] = float(extraversion_str)
                    except (IndexError, ValueError):
                        pass
                elif "Agreeableness is" in memory_content:
                    try:
                        agreeableness_str = memory_content.split("Agreeableness is ")[1].strip()
                        profile_data["agreeableness"] = float(agreeableness_str)
                    except (IndexError, ValueError):
                        pass
                elif "Neuroticism" in memory_content and "%" in memory_content:
                    try:
                        neuroticism_str = memory_content.split("Neuroticism ")[1].split("%")[0].strip()
                        profile_data["neuroticism"] = float(neuroticism_str)
                    except (IndexError, ValueError):
                        pass
            
            if profile_data:
                personality_context = f"""
                User Personality Profile:
                - Openness: {profile_data.get('openness', 0)}/100
                - Conscientiousness: {profile_data.get('conscientiousness', 0)}/100
                - Extraversion: {profile_data.get('extraversion', 0)}/100
                - Agreeableness: {profile_data.get('agreeableness', 0)}/100
                - Neuroticism: {profile_data.get('neuroticism', 0)}/100
                
                Adjust your response style and content recommendations based on these traits.
                """
        
        # Always perform personality-driven parallel searches (not optional)
        all_search_results = []
        search_insights = []
        
        if profile_data:
            import asyncio
            
            # Determine search strategies based on personality
            search_strategies = []
            personality_traits = {
                "openness": profile_data.get("openness", 0),
                "conscientiousness": profile_data.get("conscientiousness", 0),
                "extraversion": profile_data.get("extraversion", 0),
                "agreeableness": profile_data.get("agreeableness", 0),
                "neuroticism": profile_data.get("neuroticism", 0)
            }
            
            # Always include basic search
            search_strategies.append(("supporting", "general"))
            
            # Add personality-driven strategies
            if personality_traits["openness"] >= 70:
                search_strategies.extend([
                    ("contrarian", "contrarian"),
                    ("academic", "academic"),
                    ("deep_dive", "deep_dive")
                ])
                search_insights.append(f"High Openness ({personality_traits['openness']:.1f}): Including contrarian viewpoints and academic research")
            
            if personality_traits["neuroticism"] >= 70:
                search_strategies.append(("calming_content", "calming_content"))
                search_insights.append(f"High Neuroticism ({personality_traits['neuroticism']:.1f}): Including stress relief and mindfulness content")
            
            if personality_traits["conscientiousness"] >= 70:
                search_strategies.extend([
                    ("structured", "structured"),
                    ("chaos_challenge", "chaos_challenge")
                ])
                search_insights.append(f"High Conscientiousness ({personality_traits['conscientiousness']:.1f}): Including structured data and creative challenges")
            
            if personality_traits["extraversion"] >= 70:
                search_strategies.extend([
                    ("social_trends", "social_trends"),
                    ("community", "community")
                ])
                search_insights.append(f"High Extraversion ({personality_traits['extraversion']:.1f}): Including social trends and community discussions")
            
            if personality_traits["agreeableness"] >= 70:
                search_strategies.append(("multiple_perspectives", "general"))
                search_insights.append(f"High Agreeableness ({personality_traits['agreeableness']:.1f}): Including multiple perspectives")
            
            # Limit to max 5 parallel searches
            search_strategies = search_strategies[:5]
            
            # Execute parallel searches
            try:
                search_tasks = []
                for strategy_name, strategy_type in search_strategies:
                    if strategy_type == "personality_mirror":
                        task = exa_client.personality_mirror_search(
                            chat_message.message, 
                            personality_traits, 
                            num_results=3
                        )
                    else:
                        task = exa_client.parallel_search(
                            chat_message.message, 
                            strategy_type, 
                            num_results=3
                        )
                    search_tasks.append(task)
                
                # Execute all searches in parallel
                search_results_list = await asyncio.gather(*search_tasks, return_exceptions=True)
                
                # Process results and categorize them
                for i, result in enumerate(search_results_list):
                    if isinstance(result, Exception):
                        logger.warning(f"Search {i} failed: {result}")
                        continue
                    
                    if result.get("success") and result.get("results"):
                        strategy_name = search_strategies[i][0]
                        all_search_results.append({
                            "strategy": strategy_name,
                            "results": result["results"],
                            "query": result.get("query", chat_message.message),
                            "strategy_type": result.get("strategy", strategy_name)
                        })
                
            except Exception as search_error:
                logger.warning(f"Parallel search failed: {search_error}")
                # Fallback to basic search
                try:
                    basic_result = await exa_client.general_search(chat_message.message, num_results=3)
                    if basic_result.get("success"):
                        all_search_results.append({
                            "strategy": "supporting",
                            "results": basic_result["results"],
                            "query": chat_message.message,
                            "strategy_type": "general"
                        })
                except Exception as fallback_error:
                    logger.warning(f"Fallback search failed: {fallback_error}")
        
        # Generate response using OpenAI with personality context
        from openai import AsyncOpenAI
        openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Build enhanced system prompt with search insights
        search_context = ""
        if all_search_results:
            search_context = "\n\nI've automatically searched for diverse perspectives based on your personality:\n"
            for insight in search_insights:
                search_context += f"- {insight}\n"
            
            search_context += "\nSearch results by category:\n"
            for search_group in all_search_results:
                strategy = search_group["strategy"]
                results = search_group["results"][:2]  # Limit to 2 results per strategy
                search_context += f"\n{strategy.replace('_', ' ').title()}:\n"
                for result in results:
                    search_context += f"- {result.get('title', 'No title')}: {result.get('text', 'No description')[:200]}...\n"
        
        system_prompt = f"""You are a personalized AI assistant. {personality_context}{search_context}

Respond to the user's message in a way that matches their personality profile.
Weave the diverse search insights naturally into your response. Challenge the user's 
perspective when appropriate based on their personality profile. Reference specific 
sources when relevant. Be conversational and helpful."""
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": chat_message.message}
        ]
        
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        
        assistant_message = response.choices[0].message.content
        
        return {
            "status": "success",
            "response": assistant_message,
            "personality_context": personality_context,
            "search_performed": True,
            "search_results": all_search_results,
            "search_insights": search_insights,
            "personality_traits": personality_traits if profile_data else {}
        }
        
    except Exception as e:
        logger.error(f"Personalized chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/text-to-speech/{user_id}")
async def text_to_speech(user_id: str, request: dict):
    """Convert text to speech using user's cloned voice"""
    try:
        logger.info(f"Text-to-speech request for user {user_id}")
        logger.info(f"Request data: {request}")
        
        text = request.get("text", "")
        if not text:
            logger.error("No text provided in request")
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Get user's voice ID from database
        logger.info(f"Looking up user {user_id} for voice data")
        user = await supabase_client.get_user(user_id)
        logger.info(f"User lookup result: {user}")
        
        if not user:
            logger.error(f"User {user_id} not found in database")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get training job to find voice_id
        training_job = await supabase_client.get_user_training_job(user_id)
        logger.info(f"Training job lookup result: {training_job}")
        
        if not training_job or not training_job.get("voice_id"):
            logger.error(f"User {user_id} has no voice_id in training job. Training job: {training_job}")
            raise HTTPException(status_code=404, detail="User voice not found. Please complete voice training first.")
        
        voice_id = training_job["voice_id"]
        logger.info(f"Using voice_id: {voice_id}")
        
        # Convert text to speech using ElevenLabs
        audio_data = await elevenlabs_service.text_to_speech(text, voice_id)
        
        # Return audio data as base64 encoded string
        import base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return {
            "status": "success",
            "audio_data": audio_base64,
            "format": "mp3"
        }
        
    except Exception as e:
        logger.error(f"Text-to-speech error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/text-to-speech-stream/{user_id}")
async def text_to_speech_stream(user_id: str, request: dict):
    """Stream text to speech using user's cloned voice for real-time playback"""
    try:
        logger.info(f"Streaming TTS request for user {user_id}")
        
        text = request.get("text", "")
        if not text:
            logger.error("No text provided in request")
            raise HTTPException(status_code=400, detail="Text is required")
        
        # Get user's voice ID from training job
        training_job = await supabase_client.get_user_training_job(user_id)
        if not training_job or not training_job.get("voice_id"):
            raise HTTPException(status_code=404, detail="User voice not found. Please complete voice training first.")
        
        voice_id = training_job["voice_id"]
        logger.info(f"Streaming TTS with voice_id: {voice_id}")
        
        # Create a streaming response
        from fastapi.responses import StreamingResponse
        import asyncio
        
        async def generate_audio_stream():
            try:
                async for chunk in elevenlabs_service.text_to_speech_stream(text, voice_id):
                    yield chunk
            except Exception as e:
                logger.error(f"Streaming TTS error: {e}")
                # Send error as audio chunk (empty chunk to signal error)
                yield b""
        
        return StreamingResponse(
            generate_audio_stream(),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )
        
    except Exception as e:
        logger.error(f"Streaming TTS error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug/memories/{user_id}")
async def debug_memories(user_id: str):
    """Debug endpoint to see all memories for a user"""
    try:
        # Get all memories for the user
        all_memories = await mem0_client.get_all_memories(user_id)
        
        # Also try a simple search
        search_result = await mem0_client.search_memory(
            query=f"{user_id} personality",
            limit=10,
            user_id=user_id
        )
        
        return {
            "user_id": user_id,
            "all_memories": all_memories,
            "search_result": search_result,
            "total_memories": len(all_memories.get("memories", [])),
            "search_memories": len(search_result.get("memories", []))
        }
    except Exception as e:
        logger.error(f"Debug memories error: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
