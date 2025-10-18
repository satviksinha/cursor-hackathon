import os
import openai
import tiktoken
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from dotenv import load_dotenv
import json

# Load environment variables from project root
from pathlib import Path
project_root = Path(__file__).parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, supabase_client):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.supabase_client = supabase_client
        self.embedding_model = "text-embedding-3-small"
        self.generation_model = "gpt-4o-mini"
        
        # Initialize tokenizer for chunking
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Chunking parameters - smaller chunks to avoid rate limits
        self.chunk_size = 300  # tokens (reduced from 500)
        self.chunk_overlap = 30  # tokens (reduced from 50)
        
        # Circuit breaker for rate limiting
        self.rate_limit_failures = 0
        self.last_rate_limit_time = 0
        self.circuit_breaker_threshold = 3
    
    def reset_circuit_breaker(self):
        """Reset the circuit breaker state"""
        self.rate_limit_failures = 0
        self.last_rate_limit_time = 0
        logger.info("Circuit breaker reset")
    
    def get_circuit_breaker_status(self) -> Dict[str, Any]:
        """Get current circuit breaker status"""
        current_time = asyncio.get_event_loop().time()
        is_active = (self.rate_limit_failures >= self.circuit_breaker_threshold and 
                    current_time - self.last_rate_limit_time < 300)
        
        return {
            "failures": self.rate_limit_failures,
            "threshold": self.circuit_breaker_threshold,
            "is_active": is_active,
            "time_since_last_failure": current_time - self.last_rate_limit_time if self.last_rate_limit_time > 0 else 0
        }
        
    async def health_check(self) -> bool:
        """Check if OpenAI service is accessible"""
        try:
            response = self.client.models.list()
            return True
        except Exception as e:
            logger.error(f"OpenAI health check failed: {e}")
            return False
    
    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """Split text into overlapping chunks with metadata"""
        # First, try to split by sentences
        sentences = text.split('. ')
        
        # If we don't have enough sentence breaks, split by paragraphs or arbitrary length
        if len(sentences) < 2 or any(len(s) > self.chunk_size * 2 for s in sentences):
            # Fall back to character-based chunking
            return self._chunk_by_characters(text)
        
        chunks = []
        current_chunk = ""
        current_tokens = 0
        chunk_index = 0
        
        for i, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Add period back if it was removed by split
            if not sentence.endswith('.') and i < len(sentences) - 1:
                sentence += '.'
            
            sentence_tokens = len(self.tokenizer.encode(sentence))
            
            # If adding this sentence would exceed chunk size, finalize current chunk
            if current_tokens + sentence_tokens > self.chunk_size and current_chunk:
                chunks.append({
                    "chunk_index": chunk_index,
                    "text": current_chunk.strip(),
                    "token_count": current_tokens,
                    "start_position": len(text) - len(current_chunk),
                    "end_position": len(text)
                })
                chunk_index += 1
                
                # Start new chunk with overlap
                overlap_text = self._get_overlap_text(current_chunk)
                current_chunk = overlap_text + " " + sentence if overlap_text else sentence
                current_tokens = len(self.tokenizer.encode(current_chunk))
            else:
                current_chunk += " " + sentence if current_chunk else sentence
                current_tokens += sentence_tokens
        
        # Add final chunk
        if current_chunk:
            chunks.append({
                "chunk_index": chunk_index,
                "text": current_chunk.strip(),
                "token_count": current_tokens,
                "start_position": len(text) - len(current_chunk),
                "end_position": len(text)
            })
        
        return chunks
    
    def _chunk_by_characters(self, text: str) -> List[Dict[str, Any]]:
        """Fallback chunking by character count when sentence splitting fails"""
        chunks = []
        chunk_index = 0
        char_chunk_size = self.chunk_size * 4  # Rough estimate: 4 chars per token
        
        for i in range(0, len(text), char_chunk_size):
            chunk_text = text[i:i + char_chunk_size]
            token_count = len(self.tokenizer.encode(chunk_text))
            
            # If chunk is too large, trim it down
            while token_count > self.chunk_size and len(chunk_text) > 100:
                chunk_text = chunk_text[:-100]  # Remove last 100 characters
                token_count = len(self.tokenizer.encode(chunk_text))
            
            chunks.append({
                "chunk_index": chunk_index,
                "text": chunk_text.strip(),
                "token_count": token_count,
                "start_position": i,
                "end_position": i + len(chunk_text)
            })
            chunk_index += 1
        
        return chunks
    
    def _get_overlap_text(self, text: str) -> str:
        """Get overlap text from the end of a chunk"""
        tokens = self.tokenizer.encode(text)
        if len(tokens) <= self.chunk_overlap:
            return text
        
        overlap_tokens = tokens[-self.chunk_overlap:]
        return self.tokenizer.decode(overlap_tokens)
    
    async def generate_embeddings(self, chunks: List[Dict[str, Any]]) -> List[List[float]]:
        """Generate embeddings for text chunks with proper rate limiting"""
        try:
            # Check circuit breaker
            current_time = asyncio.get_event_loop().time()
            if (self.rate_limit_failures >= self.circuit_breaker_threshold and 
                current_time - self.last_rate_limit_time < 300):  # 5 minute cooldown
                raise Exception("Circuit breaker activated: Too many rate limit failures. Please try again in 5 minutes.")
            
            # Prepare texts for embedding
            texts = [chunk["text"] for chunk in chunks]
            
            # Generate embeddings in very conservative batches
            embeddings = []
            max_tokens_per_request = 1000  # Even more conservative
            max_requests_per_minute = 10   # Very conservative limit
            
            i = 0
            request_count = 0
            start_time = asyncio.get_event_loop().time()
            
            while i < len(texts):
                # Check if we've made too many requests in the last minute
                current_time = asyncio.get_event_loop().time()
                if current_time - start_time < 60 and request_count >= max_requests_per_minute:
                    wait_time = 60 - (current_time - start_time)
                    logger.info(f"Rate limit protection: waiting {wait_time:.1f} seconds")
                    await asyncio.sleep(wait_time)
                    start_time = asyncio.get_event_loop().time()
                    request_count = 0
                
                # Calculate tokens for current batch
                batch_texts = []
                current_tokens = 0
                
                # Build batch respecting token limits
                while i < len(texts) and current_tokens < max_tokens_per_request:
                    text_tokens = len(self.tokenizer.encode(texts[i]))
                    if current_tokens + text_tokens <= max_tokens_per_request:
                        batch_texts.append(texts[i])
                        current_tokens += text_tokens
                        i += 1
                    else:
                        break
                
                if not batch_texts:
                    logger.warning("No texts could fit in token limit, skipping")
                    i += 1
                    continue
                
                # Generate embeddings with retry mechanism
                try:
                    batch_embeddings = await self._generate_batch_with_retry(batch_texts)
                    embeddings.extend(batch_embeddings)
                    request_count += 1
                    
                    # Reset circuit breaker on success
                    self.rate_limit_failures = 0
                    
                except Exception as e:
                    if "rate_limit" in str(e).lower() or "429" in str(e):
                        self.rate_limit_failures += 1
                        self.last_rate_limit_time = current_time
                        logger.error(f"Rate limit failure #{self.rate_limit_failures}: {e}")
                        
                        if self.rate_limit_failures >= self.circuit_breaker_threshold:
                            raise Exception("Too many consecutive rate limit failures. Circuit breaker activated.")
                    raise
                
                # Conservative delay between requests
                await asyncio.sleep(10.0)  # Wait 10 seconds between requests
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            raise
    
    async def _generate_batch_with_retry(self, batch_texts: List[str], max_retries: int = 2) -> List[List[float]]:
        """Generate embeddings for a batch with conservative retry"""
        for attempt in range(max_retries):
            try:
                response = self.client.embeddings.create(
                    model=self.embedding_model,
                    input=batch_texts
                )
                
                return [data.embedding for data in response.data]
                
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "rate_limit" in error_str.lower():
                    if attempt < max_retries - 1:
                        # Conservative backoff: longer waits
                        wait_time = 30 + (attempt * 30)  # 30s, 60s
                        logger.warning(f"Rate limit hit, waiting {wait_time} seconds before retry {attempt + 1}")
                        await asyncio.sleep(wait_time)
                        continue
                    else:
                        logger.error(f"Rate limit exceeded after {max_retries} retries - giving up")
                        raise Exception(f"Rate limit exceeded after {max_retries} retries. Please try again later.")
                else:
                    # Non-rate-limit error, don't retry
                    logger.error(f"Non-rate-limit error in embedding generation: {e}")
                    raise
        
        raise Exception("Max retries exceeded")
    
    async def store_embeddings(self, user_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]) -> bool:
        """Store embeddings in Supabase"""
        try:
            logger.info(f"Preparing to store {len(embeddings)} embeddings for user {user_id}")
            
            # Validate inputs
            if len(chunks) != len(embeddings):
                logger.error(f"Chunk/embedding count mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings")
                return False
            
            # Prepare data for insertion
            embedding_data = []
            for chunk, embedding in zip(chunks, embeddings):
                embedding_data.append({
                    "user_id": user_id,
                    "chunk_index": chunk["chunk_index"],
                    "chunk_text": chunk["text"],
                    "embedding": embedding,
                    "metadata": {
                        "token_count": chunk["token_count"],
                        "start_position": chunk["start_position"],
                        "end_position": chunk["end_position"]
                    }
                })
            
            logger.info(f"Prepared {len(embedding_data)} embedding records for insertion")
            
            # Insert embeddings in batches
            batch_size = 50
            total_inserted = 0
            
            for i in range(0, len(embedding_data), batch_size):
                batch = embedding_data[i:i + batch_size]
                batch_num = i // batch_size + 1
                
                logger.info(f"Inserting batch {batch_num} with {len(batch)} embeddings")
                
                try:
                    result = await self.supabase_client.client.table("text_embeddings").insert(batch).execute()
                    
                    if not result.data:
                        logger.error(f"Failed to insert embeddings batch {batch_num} - no data returned")
                        return False
                    
                    inserted_count = len(result.data)
                    total_inserted += inserted_count
                    logger.info(f"Successfully inserted {inserted_count} embeddings in batch {batch_num}")
                    
                except Exception as batch_error:
                    logger.error(f"Failed to insert batch {batch_num}: {batch_error}")
                    return False
            
            logger.info(f"Successfully stored {total_inserted} embeddings for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store embeddings for user {user_id}: {e}", exc_info=True)
            return False
    
    async def retrieve_relevant_chunks(self, user_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most relevant chunks for a query"""
        try:
            # Generate embedding for the query
            query_response = self.client.embeddings.create(
                model=self.embedding_model,
                input=[query]
            )
            query_embedding = query_response.data[0].embedding
            
            # Search for similar embeddings using pgvector
            result = await self.supabase_client.client.rpc(
                "match_embeddings",
                {
                    "query_embedding": query_embedding,
                    "match_threshold": 0.7,
                    "match_count": limit,
                    "user_id": user_id
                }
            ).execute()
            
            if not result.data:
                logger.warning(f"No relevant chunks found for user {user_id}")
                return []
            
            return result.data
            
        except Exception as e:
            logger.error(f"Failed to retrieve chunks: {e}")
            # Fallback: return empty list
            return []
    
    async def process_user_data(self, user_id: str, text_data: str) -> bool:
        """Process user text data: chunk, embed, and store"""
        try:
            logger.info(f"Processing text data for user {user_id}")
            logger.info(f"Text data length: {len(text_data)} characters")
            
            # Validate text data
            if not text_data or not text_data.strip():
                logger.error(f"Empty or invalid text data for user {user_id}")
                return False
            
            # Estimate processing requirements
            estimate = self.estimate_processing_time(text_data)
            logger.info(f"Processing estimate: {estimate['total_chunks']} chunks, "
                       f"{estimate['total_tokens']} tokens, "
                       f"~{estimate['estimated_time_seconds']:.1f}s")
            
            if estimate['warning']:
                logger.warning(f"Large dataset warning: {estimate['warning']}")
            
            # Step 1: Chunk the text
            logger.info(f"Starting text chunking for user {user_id}")
            chunks = self.chunk_text(text_data)
            logger.info(f"Created {len(chunks)} chunks for user {user_id}")
            
            if not chunks:
                logger.error(f"No chunks created for user {user_id} - text may be too short or invalid")
                return False
            
            # Log first chunk for debugging
            if chunks:
                logger.info(f"First chunk preview: {chunks[0]['text'][:100]}...")
            
            # Step 2: Generate embeddings
            logger.info(f"Starting embedding generation for user {user_id}")
            try:
                embeddings = await self.generate_embeddings(chunks)
                logger.info(f"Generated {len(embeddings)} embeddings for user {user_id}")
                
                if len(embeddings) != len(chunks):
                    logger.error(f"Embedding count mismatch: {len(embeddings)} embeddings vs {len(chunks)} chunks")
                    return False
                    
            except Exception as e:
                logger.error(f"Embedding generation failed for user {user_id}: {e}")
                if "circuit breaker" in str(e).lower():
                    logger.error(f"Circuit breaker activated for user {user_id}: {e}")
                    raise Exception("Rate limiting circuit breaker activated. Please wait 5 minutes before retrying.")
                else:
                    raise
            
            # Step 3: Store embeddings
            logger.info(f"Starting embedding storage for user {user_id}")
            success = await self.store_embeddings(user_id, chunks, embeddings)
            
            if success:
                logger.info(f"Successfully processed data for user {user_id}")
            else:
                logger.error(f"Failed to store embeddings for user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error processing user data for {user_id}: {e}", exc_info=True)
            return False
    
    async def generate_response(self, user_id: str, message: str) -> str:
        """Generate response using RAG"""
        try:
            # Retrieve relevant chunks
            relevant_chunks = await self.retrieve_relevant_chunks(user_id, message, limit=5)
            
            # Build context from retrieved chunks
            context = ""
            if relevant_chunks:
                context = "\n\n".join([
                    f"Example {i+1}: {chunk['chunk_text']}" 
                    for i, chunk in enumerate(relevant_chunks)
                ])
            
            # Build system prompt
            system_prompt = f"""You are speaking as the user whose communication style is captured in the examples below. 
            Respond naturally in their voice and style, incorporating their personality, vocabulary, and communication patterns.
            
            Examples of their communication style:
            {context}
            
            Respond to the user's message in their authentic voice and style."""
            
            # Generate response
            response = self.client.chat.completions.create(
                model=self.generation_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            # Fallback response
            return "I'm having trouble processing that right now. Could you try again?"
    
    async def generate_response_stream(self, user_id: str, message: str):
        """Generate streaming response using RAG"""
        try:
            # Retrieve relevant chunks
            relevant_chunks = await self.retrieve_relevant_chunks(user_id, message, limit=5)
            
            # Build context from retrieved chunks
            context = ""
            if relevant_chunks:
                context = "\n\n".join([
                    f"Example {i+1}: {chunk['chunk_text']}" 
                    for i, chunk in enumerate(relevant_chunks)
                ])
            
            # Build system prompt
            system_prompt = f"""You are speaking as the user whose communication style is captured in the examples below. 
            Respond naturally in their voice and style, incorporating their personality, vocabulary, and communication patterns.
            
            Examples of their communication style:
            {context}
            
            Respond to the user's message in their authentic voice and style."""
            
            # Generate streaming response
            stream = self.client.chat.completions.create(
                model=self.generation_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                max_tokens=200,
                temperature=0.7,
                stream=True
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"Failed to generate streaming response: {e}")
            yield "I'm having trouble processing that right now. Could you try again?"
