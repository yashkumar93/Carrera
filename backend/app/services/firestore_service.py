"""
Firestore service layer — centralizes all Firebase Admin SDK
initialization and Firestore CRUD operations.
"""
import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialization
# ---------------------------------------------------------------------------

_firebase_app = None


def init_firebase():
    """Initialize Firebase Admin SDK (idempotent)."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app

    try:
        cred_path = settings.firebase_credentials_path
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized with service account.")
        else:
            # Fall back to Application Default Credentials (cloud envs)
            _firebase_app = firebase_admin.initialize_app()
            logger.info("Firebase Admin SDK initialized with default credentials.")
    except ValueError:
        # App already initialized (e.g. during hot-reload)
        _firebase_app = firebase_admin.get_app()
        logger.info("Reusing existing Firebase Admin app.")

    return _firebase_app


def cleanup_firebase():
    """Clean up Firebase app on shutdown."""
    global _firebase_app
    if _firebase_app is not None:
        try:
            firebase_admin.delete_app(_firebase_app)
            _firebase_app = None
            logger.info("Firebase Admin app cleaned up.")
        except Exception as exc:
            logger.warning("Error cleaning up Firebase app: %s", exc)


def get_firestore_client():
    """Return a Firestore client, initializing Firebase if needed."""
    init_firebase()
    return firestore.client()


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------

def create_session(user_id: str, first_message: str) -> str:
    """Create a new session document and return its ID."""
    db = get_firestore_client()

    title = first_message[:50] + ("..." if len(first_message) > 50 else "")
    doc_data = {
        "userId": user_id,
        "title": title,
        "stage": "discovery",
        "messages": [
            {
                "content": first_message,
                "isUser": True,
                "timestamp": datetime.utcnow().isoformat(),
            }
        ],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }

    doc_ref = db.collection("sessions").document()
    doc_ref.set(doc_data)
    logger.info("Created session %s for user %s", doc_ref.id, user_id)
    return doc_ref.id


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single session by its document ID."""
    db = get_firestore_client()
    doc = db.collection("sessions").document(session_id).get()
    if doc.exists:
        return {"id": doc.id, **doc.to_dict()}
    return None


def get_user_sessions(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List sessions belonging to a user, newest first (paginated)."""
    db = get_firestore_client()
    query = (
        db.collection("sessions")
        .where(filter=FieldFilter("userId", "==", user_id))
        .order_by("updatedAt", direction=firestore.Query.DESCENDING)
        .offset(offset)
        .limit(limit)
    )
    docs = query.stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def update_session(
    session_id: str,
    user_msg: str,
    ai_response: str,
    stage: str,
) -> None:
    """Append a user + assistant message pair and update stage."""
    db = get_firestore_client()
    doc_ref = db.collection("sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        logger.warning("Attempted to update non-existent session %s", session_id)
        return

    data = doc.to_dict()
    current_messages = data.get("messages", [])
    now = datetime.utcnow().isoformat()

    current_messages.append({"content": user_msg, "isUser": True, "timestamp": now})
    current_messages.append({"content": ai_response, "isUser": False, "timestamp": now})

    update_data = {
        "messages": current_messages,
        "stage": stage,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }

    # Auto-update title after first AI response (when there are only 2 messages
    # total: the user's first message + the welcome AI response)
    if len(current_messages) <= 3:
        # Generate a smarter title from the first user message
        smart_title = _generate_smart_title(user_msg)
        update_data["title"] = smart_title

    doc_ref.update(update_data)
    logger.info("Updated session %s — stage=%s", session_id, stage)


def update_session_title(session_id: str, title: str) -> None:
    """Update only the session title."""
    db = get_firestore_client()
    doc_ref = db.collection("sessions").document(session_id)
    doc_ref.update({
        "title": title,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("Renamed session %s to '%s'", session_id, title)


def delete_session(session_id: str) -> None:
    """Delete a session document."""
    db = get_firestore_client()
    db.collection("sessions").document(session_id).delete()
    logger.info("Deleted session %s", session_id)


def _generate_smart_title(message: str) -> str:
    """Generate a concise session title from a message, truncated at word boundary."""
    # Remove extra whitespace
    clean = " ".join(message.split())
    if len(clean) <= 60:
        return clean
    # Truncate at word boundary
    truncated = clean[:60]
    last_space = truncated.rfind(" ")
    if last_space > 20:
        truncated = truncated[:last_space]
    return truncated + "..."


# ---------------------------------------------------------------------------
# User Profile CRUD
# ---------------------------------------------------------------------------

def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a user's profile from Firestore."""
    db = get_firestore_client()
    doc = db.collection("users").document(user_id).get()
    if doc.exists:
        return doc.to_dict()
    return None


def update_user_profile(user_id: str, data: Dict[str, Any]) -> None:
    """Create or merge user profile data."""
    db = get_firestore_client()
    doc_ref = db.collection("users").document(user_id)
    doc_ref.set(
        {**data, "updatedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    logger.info("Updated profile for user %s", user_id)


def delete_user_profile(user_id: str) -> None:
    """Delete a user's profile document (GDPR)."""
    db = get_firestore_client()
    db.collection("users").document(user_id).delete()
    logger.info("Deleted profile for user %s", user_id)


# ---------------------------------------------------------------------------
# Message Feedback
# ---------------------------------------------------------------------------

def save_message_feedback(
    session_id: str,
    rating: str,
    message_snapshot: Optional[str],
    comment: Optional[str],
) -> None:
    """Append a feedback entry to the session's feedbacks array."""
    db = get_firestore_client()
    doc_ref = db.collection("sessions").document(session_id)
    doc = doc_ref.get()

    if not doc.exists:
        logger.warning("Attempted to save feedback on non-existent session %s", session_id)
        return

    current_feedbacks = doc.to_dict().get("feedbacks", [])
    current_feedbacks.append({
        "rating": rating,
        "message_snapshot": (message_snapshot or "")[:500],
        "comment": comment or "",
        "created_at": datetime.utcnow().isoformat(),
    })

    doc_ref.update({"feedbacks": current_feedbacks})
    logger.info("Saved %s feedback on session %s", rating, session_id)


# ---------------------------------------------------------------------------
# Role-Based Access Control
# ---------------------------------------------------------------------------

VALID_ROLES = {"user", "admin", "counselor"}


def get_user_role(user_id: str) -> str:
    """Return the user's role from Firestore. Defaults to 'user' if not set."""
    try:
        db = get_firestore_client()
        doc = db.collection("users").document(user_id).get()
        if doc.exists:
            return doc.to_dict().get("role", "user")
    except Exception as exc:
        logger.warning("Could not fetch role for user %s: %s", user_id, exc)
    return "user"


def set_user_role(user_id: str, role: str) -> None:
    """Set a user's role. Role must be one of VALID_ROLES."""
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role '{role}'. Must be one of: {VALID_ROLES}")
    db = get_firestore_client()
    db.collection("users").document(user_id).set(
        {"role": role, "updatedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )
    logger.info("Set role '%s' for user %s", role, user_id)


# ---------------------------------------------------------------------------
# Admin analytics
# ---------------------------------------------------------------------------

def get_admin_stats() -> Dict[str, Any]:
    """Aggregate platform-wide stats for the admin dashboard."""
    db = get_firestore_client()

    # Count total users
    users_docs = list(db.collection("users").stream())
    total_users = len(users_docs)

    # Count users by role
    role_counts: Dict[str, int] = {}
    for doc in users_docs:
        role = doc.to_dict().get("role", "user")
        role_counts[role] = role_counts.get(role, 0) + 1

    # Count total sessions and messages
    sessions_docs = list(db.collection("sessions").stream())
    total_sessions = len(sessions_docs)
    total_messages = 0
    total_feedback = 0
    thumbs_up = 0
    thumbs_down = 0
    stage_counts: Dict[str, int] = {}

    for doc in sessions_docs:
        data = doc.to_dict()
        total_messages += len(data.get("messages", []))
        feedbacks = data.get("feedbacks", [])
        total_feedback += len(feedbacks)
        for fb in feedbacks:
            if fb.get("rating") == "thumbs_up":
                thumbs_up += 1
            elif fb.get("rating") == "thumbs_down":
                thumbs_down += 1
        stage = data.get("stage", "discovery")
        stage_counts[stage] = stage_counts.get(stage, 0) + 1

    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "total_feedback": total_feedback,
        "thumbs_up": thumbs_up,
        "thumbs_down": thumbs_down,
        "thumbs_up_rate": round(thumbs_up / total_feedback * 100, 1) if total_feedback else 0,
        "role_counts": role_counts,
        "stage_counts": stage_counts,
        "avg_messages_per_session": round(total_messages / total_sessions, 1) if total_sessions else 0,
    }


def get_all_users(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """List all user profiles (admin only)."""
    db = get_firestore_client()
    docs = list(db.collection("users").offset(offset).limit(limit).stream())
    return [{"uid": doc.id, **doc.to_dict()} for doc in docs]


# ---------------------------------------------------------------------------
# Resume / Skill Extraction Storage
# ---------------------------------------------------------------------------

def save_resume_analysis(user_id: str, analysis: Dict[str, Any]) -> None:
    """Store Gemini-extracted resume analysis in the user's profile."""
    db = get_firestore_client()
    db.collection("users").document(user_id).set(
        {
            "resume_analysis": analysis,
            "updatedAt": firestore.SERVER_TIMESTAMP,
        },
        merge=True,
    )
    logger.info("Saved resume analysis for user %s", user_id)


# ---------------------------------------------------------------------------
# Aptitude Assessments Storage
# ---------------------------------------------------------------------------

def save_assessment_result(user_id: str, result: Dict[str, Any]) -> str:
    """Store a scored assessment result and return its document ID."""
    db = get_firestore_client()
    doc_ref = db.collection("users").document(user_id).collection("assessments").document()
    doc_ref.set({
        **result,
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("Saved assessment for user %s — id=%s", user_id, doc_ref.id)
    return doc_ref.id


def get_assessment_history(user_id: str) -> List[Dict[str, Any]]:
    """List past assessments for a user, newest first."""
    db = get_firestore_client()
    docs = (
        db.collection("users").document(user_id)
        .collection("assessments")
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .limit(20)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def check_firestore_health() -> bool:
    """Return True if Firestore is reachable."""
    try:
        db = get_firestore_client()
        # Perform a lightweight read
        db.collection("sessions").limit(1).get()
        return True
    except Exception as exc:
        logger.error("Firestore health check failed: %s", exc)
        return False
