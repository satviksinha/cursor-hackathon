import os
import jwt
from typing import Optional
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)

def verify_supabase_token(token: str) -> Optional[str]:
    """
    Verify Supabase JWT token and extract user ID
    """
    try:
        logger.info(f"Verifying token: {token[:20]}...")
        
        # Get Supabase JWT secret from environment
        jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
        if not jwt_secret:
            logger.warning("SUPABASE_JWT_SECRET not found in environment")
            return None
        
        logger.info(f"JWT secret found: {jwt_secret[:10]}...")
        
        # Decode the token (skip audience verification for now)
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"], options={"verify_aud": False})
        logger.info(f"Token payload: {payload}")
        
        # Extract user ID
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("No user ID found in token payload")
            return None
            
        logger.info(f"Extracted user ID: {user_id}")
        return user_id
        
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None
    except Exception as e:
        logger.error(f"Token verification error: {e}", exc_info=True)
        return None

def get_user_id_from_token(authorization: Optional[str]) -> str:
    """
    Extract user ID from Authorization header
    """
    logger.info(f"Getting user ID from authorization: {authorization}")
    
    if not authorization:
        logger.warning("Authorization header missing")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing"
        )
    
    if not authorization.startswith("Bearer "):
        logger.warning(f"Invalid authorization header format: {authorization}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    token = authorization[7:]  # Remove "Bearer " prefix
    logger.info(f"Extracted token: {token[:20]}...")
    
    user_id = verify_supabase_token(token)
    
    if not user_id:
        logger.warning("Token verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    logger.info(f"Successfully authenticated user: {user_id}")
    return user_id
