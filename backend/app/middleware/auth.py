"""
Authentication middleware — FastAPI dependencies for Firebase token
verification and role-based access control.
"""
import logging
from typing import Optional, Dict, Any

from fastapi import Header, HTTPException, status
from firebase_admin import auth

from app.services.firestore_service import (
    init_firebase,
    get_user_role,
    get_user_profile,
    update_user_profile,
)

logger = logging.getLogger(__name__)


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer <Firebase ID token>"),
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and verifies the Firebase ID token.

    Returns a dict with keys: uid, email, name, role.
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
        uid   = decoded["uid"]
        email = decoded.get("email")
        name  = decoded.get("name")
        photo = decoded.get("picture")

        # Safety-net: create user document if it somehow doesn't exist yet.
        # This is cheap (one read) and ensures every authenticated user always
        # has a profile row before any route handler runs.
        try:
            existing = get_user_profile(uid)
            if not existing:
                update_user_profile(uid, {
                    "email":               email,
                    "display_name":        name or "",
                    "photo_url":           photo or "",
                    "onboarding_complete": False,
                })
                logger.info("Auto-created Firestore profile for user %s", uid)
        except Exception as profile_exc:
            # Non-fatal — don't block auth if Firestore is temporarily down.
            logger.warning("Could not auto-create profile for %s: %s", uid, profile_exc)

        role = get_user_role(uid)
        return {
            "uid":   uid,
            "email": email,
            "name":  name,
            "role":  role,
        }
    except HTTPException:
        raise
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


async def require_admin(user: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    FastAPI dependency that requires the current user to have admin role.
    Must be used after get_current_user.
    """
    if user is None or user.get("role") not in ("admin",):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user
