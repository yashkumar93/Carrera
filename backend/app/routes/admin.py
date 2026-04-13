"""
Admin-only endpoints — analytics, user management, role assignment.
All routes require the caller to have role='admin'.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict

from app.middleware.auth import get_current_user, require_admin
from app.services import firestore_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="New role: 'user', 'admin', or 'counselor'")


# ---------------------------------------------------------------------------
# Dependency: authenticated admin
# ---------------------------------------------------------------------------

async def admin_user(user: Dict = Depends(get_current_user)) -> Dict:
    return await require_admin(user)


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@router.get("/admin/stats")
async def get_stats(user: Dict = Depends(admin_user)):
    """Return platform-wide aggregate stats."""
    stats = firestore_service.get_admin_stats()
    return stats


@router.get("/admin/feedback-analytics")
async def get_feedback_analytics(user: Dict = Depends(admin_user)):
    """Return feedback topic analysis and recommendation quality signals."""
    return firestore_service.get_feedback_analytics()


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@router.get("/admin/users")
async def list_users(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: Dict = Depends(admin_user),
):
    """List all registered users with their roles."""
    users = firestore_service.get_all_users(limit=limit, offset=offset)
    return {"users": users, "limit": limit, "offset": offset}


@router.patch("/admin/users/{target_uid}/role")
async def update_user_role(
    target_uid: str,
    body: RoleUpdateRequest,
    user: Dict = Depends(admin_user),
):
    """Assign a role to any user. Valid roles: user, admin, counselor."""
    try:
        firestore_service.set_user_role(target_uid, body.role)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    logger.info("Admin %s set role '%s' for user %s", user["uid"], body.role, target_uid)
    return {"message": f"Role updated to '{body.role}'", "uid": target_uid, "role": body.role}


@router.get("/admin/users/{target_uid}")
async def get_user(target_uid: str, user: Dict = Depends(admin_user)):
    """Get a specific user's profile."""
    profile = firestore_service.get_user_profile(target_uid)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"uid": target_uid, "profile": profile}
