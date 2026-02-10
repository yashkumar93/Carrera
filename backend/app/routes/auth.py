"""
Firebase authentication endpoints
"""
import logging
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from firebase_admin import auth

from app.services.firestore_service import init_firebase

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/verify-token")
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verify Firebase ID token from frontend.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header",
        )

    token = authorization.split("Bearer ", 1)[1]

    try:
        init_firebase()
        decoded_token = auth.verify_id_token(token)

        return {
            "valid": True,
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
        }
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )
