import os
import openai
import json
import asyncio
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class OpenAIFineTuningService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        # Use gpt-3.5-turbo for fine-tuning as gpt-4o-mini doesn't support fine-tuning
        self.base_model = "gpt-3.5-turbo"
        
    async def health_check(self) -> bool:
        """Check if OpenAI service is accessible"""
        try:
            response = self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
    
    async def get_fine_tuning_models(self) -> list:
        """Get list of models available for fine-tuning"""
        try:
            response = self.client.models.list()
            fine_tuning_models = []
            for model in response.data:
                # Check if model supports fine-tuning
                if hasattr(model, 'fine_tuning') and model.fine_tuning:
                    fine_tuning_models.append(model.id)
                # Also check for known fine-tuning models
                elif model.id in ['gpt-3.5-turbo', 'babbage-002', 'davinci-002']:
                    fine_tuning_models.append(model.id)
            
            # If no models found, return known fine-tuning models
            if not fine_tuning_models:
                fine_tuning_models = ['gpt-3.5-turbo', 'babbage-002', 'davinci-002']
            
            return fine_tuning_models
        except Exception as e:
            logger.error(f"Failed to get fine-tuning models: {e}")
            # Return known fine-tuning models as fallback
            return ['gpt-3.5-turbo', 'babbage-002', 'davinci-002']
    
    def format_training_data(self, text_data: str) -> List[Dict[str, str]]:
        """Format raw text data into OpenAI fine-tuning format"""
        # Parse chat exports or plain text into conversational format
        conversations = []
        
        # Simple parsing - in production, you'd want more sophisticated parsing
        lines = text_data.split('\n')
        current_conversation = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Assume user messages are lines that don't start with common prefixes
            if not any(line.startswith(prefix) for prefix in ['[', '(', 'System:', 'Bot:']):
                current_conversation.append({
                    "role": "user",
                    "content": line
                })
                
                # Create a response (in real implementation, you'd pair with actual responses)
                conversations.append({
                    "messages": [
                        {"role": "system", "content": "You are a helpful assistant that speaks in the user's personal style and tone."},
                        {"role": "user", "content": line},
                        {"role": "assistant", "content": f"I understand. {line.lower()}"}  # Placeholder response
                    ]
                })
        
        return conversations
    
    async def create_training_file(self, training_data: List[Dict[str, str]]) -> str:
        """Create training file and upload to OpenAI"""
        # Convert to JSONL format
        jsonl_data = []
        for conversation in training_data:
            jsonl_data.append(json.dumps(conversation))
        
        jsonl_content = '\n'.join(jsonl_data)
        
        # Create file
        training_file = self.client.files.create(
            file=jsonl_content.encode(),
            purpose="fine-tune"
        )
        
        return training_file.id
    
    async def start_fine_tuning(self, training_file_id: str) -> str:
        """Start fine-tuning job"""
        try:
            logger.info(f"Starting fine-tuning with model: {self.base_model}")
            logger.info(f"Training file ID: {training_file_id}")
            
            fine_tuning_job = self.client.fine_tuning.jobs.create(
                training_file=training_file_id,
                model=self.base_model,
                hyperparameters={
                    "n_epochs": 3,  # Keep low for speed
                    "batch_size": 1,
                    "learning_rate_multiplier": 0.1
                }
            )
            
            logger.info(f"Started fine-tuning job: {fine_tuning_job.id}")
            return fine_tuning_job.id
            
        except Exception as e:
            logger.error(f"Failed to start fine-tuning: {e}")
            logger.error(f"Error details: {str(e)}")
            raise
    
    async def get_fine_tuning_status(self, job_id: str) -> Dict[str, Any]:
        """Get fine-tuning job status"""
        try:
            job = self.client.fine_tuning.jobs.retrieve(job_id)
            
            # Handle error field properly - only include if there's actually an error
            error_info = None
            if job.error and hasattr(job.error, 'message') and job.error.message:
                error_info = {
                    "code": getattr(job.error, 'code', None),
                    "message": job.error.message,
                    "param": getattr(job.error, 'param', None)
                }
            elif job.error and isinstance(job.error, dict) and job.error.get('message'):
                error_info = job.error
            
            return {
                "id": job.id,
                "status": job.status,
                "model": job.fine_tuned_model,
                "created_at": job.created_at,
                "finished_at": job.finished_at,
                "trained_tokens": job.trained_tokens,
                "error": error_info
            }
        except Exception as e:
            logger.error(f"Failed to get fine-tuning status: {e}")
            raise
    
    async def generate_response(self, model_id: str, messages: List[Dict[str, str]]) -> str:
        """Generate response using fine-tuned model"""
        try:
            response = self.client.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=150,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            # Fallback to base model
            response = self.client.chat.completions.create(
                model=self.base_model,
                messages=messages,
                max_tokens=150,
                temperature=0.7
            )
            return response.choices[0].message.content
    
    async def generate_response_stream(self, model_id: str, messages: List[Dict[str, str]]):
        """Generate streaming response using fine-tuned model"""
        try:
            stream = self.client.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=150,
                temperature=0.7,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Failed to generate streaming response: {e}")
            # Fallback to base model
            stream = self.client.chat.completions.create(
                model=self.base_model,
                messages=messages,
                max_tokens=150,
                temperature=0.7,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
