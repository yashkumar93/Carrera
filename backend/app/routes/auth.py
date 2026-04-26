"""
Firebase authentication endpoints
"""
import logging
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from firebase_admin import auth

from app.services.firestore_service import init_firebase, update_user_profile, get_user_profile

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/verify-token")
async def verify_token(authorization: Optional[str] = Header(None)):
    """
    Verify Firebase ID token from frontend and upsert the user document in
    Firestore so the profile is always initialised on first sign-in.
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

        uid   = decoded_token["uid"]
        email = decoded_token.get("email")
        name  = decoded_token.get("name")
        photo = decoded_token.get("picture")

        # ── Upsert user document ──────────────────────────────────────────
        # merge=True means existing fields (e.g. onboarding_complete, skills)
        # are never overwritten — we only fill in what isn't already there.
        existing = get_user_profile(uid)
        profile_patch = {"email": email}

        # Only set display_name and photo_url on first sign-in so users can
        # later update them without being clobbered on the next login.
        if not existing:
            profile_patch["display_name"] = name or ""
            profile_patch["photo_url"]    = photo or ""
            profile_patch["onboarding_complete"] = False
            logger.info("New user created in Firestore: %s (%s)", uid, email)
        else:
            # Always keep email in sync in case the user changes it.
            if existing.get("email") != email:
                profile_patch["email"] = email

        update_user_profile(uid, profile_patch)
        # ─────────────────────────────────────────────────────────────────

        return {
            "valid": True,
            "uid":   uid,
            "email": email,
            "name":  name,
            "is_new_user": not bool(existing),
        }
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
        )
