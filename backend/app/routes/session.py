"""
Session management endpoints
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field
from typing import Dict, Optional

from app.middleware.auth import get_current_user
from app.services import firestore_service
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class SessionUpdateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="New session title")


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    career_interests: Optional[list] = None
    skills: Optional[list] = None
    experience_level: Optional[str] = None
    education: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)


# ---------------------------------------------------------------------------
# Session endpoints
# ---------------------------------------------------------------------------

@router.get("/sessions")
async def list_sessions(
    user: Dict = Depends(get_current_user),
    limit: int = Query(default=20, ge=1, le=100, description="Max sessions to return"),
    offset: int = Query(default=0, ge=0, description="Number of sessions to skip"),
):
    """List all sessions for the authenticated user (paginated)."""
    sessions = firestore_service.get_user_sessions(
        user["uid"], limit=limit, offset=offset
    )
    return {"sessions": sessions, "limit": limit, "offset": offset}


@router.get("/session/{session_id}")
async def get_session(session_id: str, user: Dict = Depends(get_current_user)):
    """Get session information (only if it belongs to the current user)."""
    session = firestore_service.get_session(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("userId") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return session


@router.patch("/session/{session_id}")
async def update_session_title(
    session_id: str,
    body: SessionUpdateRequest,
    user: Dict = Depends(get_current_user),
):
    """Rename a session (only if it belongs to the current user)."""
    session = firestore_service.get_session(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("userId") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    firestore_service.update_session_title(session_id, body.title)
    return {"message": "Session updated", "title": body.title}


@router.delete("/session/{session_id}")
async def delete_session(session_id: str, user: Dict = Depends(get_current_user)):
    """Delete a session (only if it belongs to the current user)."""
    session = firestore_service.get_session(session_id)

    if session and session.get("userId") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    firestore_service.delete_session(session_id)
    return {"message": "Session deleted"}


@router.get("/session/{session_id}/export")
async def export_session(session_id: str, user: Dict = Depends(get_current_user)):
    """Export a conversation as markdown."""
    session = firestore_service.get_session(session_id)

    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.get("userId") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Build markdown
    title = session.get("title", "Careerra Conversation")
    messages = session.get("messages", [])
    stage = session.get("stage", "discovery")

    lines = [
        f"# {title}",
        f"",
        f"**Stage:** {stage}",
        f"",
        f"---",
        f"",
    ]

    for msg in messages:
        role = "**You**" if msg.get("isUser") else "**Careerra**"
        timestamp = msg.get("timestamp", "")
        lines.append(f"### {role}")
        if timestamp:
            lines.append(f"*{timestamp}*")
        lines.append(f"")
        lines.append(msg.get("content", ""))
        lines.append(f"")
        lines.append(f"---")
        lines.append(f"")

    markdown_content = "\n".join(lines)

    return PlainTextResponse(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f'attachment; filename="{title[:50]}.md"'
        },
    )


# ---------------------------------------------------------------------------
# Profile endpoints
# ---------------------------------------------------------------------------

@router.get("/profile")
async def get_profile(user: Dict = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    profile = firestore_service.get_user_profile(user["uid"])
    if profile is None:
        return {"uid": user["uid"], "email": user.get("email"), "profile": {}}
    return {"uid": user["uid"], "email": user.get("email"), "profile": profile}


@router.put("/profile")
async def update_profile(body: ProfileUpdateRequest, user: Dict = Depends(get_current_user)):
    """Update the authenticated user's profile."""
    data = body.model_dump(exclude_none=True)
    firestore_service.update_user_profile(user["uid"], data)
    return {"message": "Profile updated", "profile": data}


# ---------------------------------------------------------------------------
# Stages (public)
# ---------------------------------------------------------------------------

@router.get("/stages")
async def get_stages():
    """Get available conversation stages (public)."""
    return {
        "stages": [
            {
                "id": "discovery",
                "name": "Personal Discovery",
                "description": "Understanding your interests, skills, and background",
            },
            {
                "id": "assessment",
                "name": "Skills Assessment",
                "description": "Evaluating your current capabilities and experience",
            },
            {
                "id": "exploration",
                "name": "Career Exploration",
                "description": "Exploring potential career paths that match your profile",
            },
            {
                "id": "roadmap",
                "name": "Strategic Roadmap",
                "description": "Creating an actionable plan to achieve your goals",
            },
        ]
    }
