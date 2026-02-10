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
