"""
Authentication middleware — FastAPI dependencies for Firebase token
verification.
"""
import logging
from typing import Optional, Dict, Any

from fastapi import Header, HTTPException, status
from firebase_admin import auth

from app.services.firestore_service import init_firebase

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <Firebase ID token>"),
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and verifies the Firebase ID token.

    Returns a dict with keys: uid, email, name.
    Raises 401 if the token is missing, malformed, or invalid.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header. Please sign in.",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'.",
        )

    token = authorization.split("Bearer ", 1)[1]

    try:
        init_firebase()
        decoded = auth.verify_id_token(token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "name": decoded.get("name"),
        }
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )


async def get_optional_user(
    authorization: Optional[str] = Header(None),
) -> Optional[Dict[str, Any]]:
    """
    Same as get_current_user but returns None instead of raising 401.
    Useful for routes that work with or without auth.
    """
    if authorization is None:
        return None

    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
