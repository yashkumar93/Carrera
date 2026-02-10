"""
Session management endpoints
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from datetime import datetime
import uuid

router = APIRouter()

# In-memory session storage (for demo purposes)
# In production, use Firebase Firestore or another persistent store
sessions: Dict[str, dict] = {}


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get session information"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]


@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id in sessions:
        del sessions[session_id]
    
    return {"message": "Session deleted"}


@router.get("/stages")
async def get_stages():
    """Get available conversation stages"""
    return {
        "stages": [
            {
                "id": "discovery",
                "name": "Personal Discovery",
                "description": "Understanding your interests, skills, and background"
            },
            {
                "id": "assessment",
                "name": "Skills Assessment",
                "description": "Evaluating your current capabilities and experience"
            },
            {
                "id": "exploration",
                "name": "Career Exploration",
                "description": "Exploring potential career paths that match your profile"
            },
            {
                "id": "roadmap",
                "name": "Strategic Roadmap",
                "description": "Creating an actionable plan to achieve your goals"
            }
        ]
    }


def create_session(user_message: str) -> str:
    """Create a new session and return its ID"""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "id": session_id,
        "created_at": datetime.now().isoformat(),
        "stage": "discovery",
        "messages": [],
        "context": {}
    }
    return session_id


def get_or_create_session(session_id: Optional[str], message: str) -> tuple:
    """Get existing session or create new one"""
    if session_id and session_id in sessions:
        return session_id, sessions[session_id]
    
    new_id = create_session(message)
    return new_id, sessions[new_id]


def update_session(session_id: str, message: dict, response: str, stage: str):
    """Update session with new message and response"""
    if session_id in sessions:
        sessions[session_id]["messages"].append({
            "role": "user",
            "content": message["content"],
            "timestamp": datetime.now().isoformat()
        })
        sessions[session_id]["messages"].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        })
        sessions[session_id]["stage"] = stage
