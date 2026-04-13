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
# Mentorship Marketplace
# ---------------------------------------------------------------------------

def register_mentor(user_id: str, data: Dict[str, Any]) -> str:
    """Create or overwrite a mentor profile. Returns the mentor doc ID (== user_id)."""
    db = get_firestore_client()
    doc_ref = db.collection("mentors").document(user_id)
    doc_ref.set({
        **data,
        "uid": user_id,
        "rating": data.get("rating", 0.0),
        "review_count": data.get("review_count", 0),
        "verified": False,
        "active": True,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    logger.info("Registered/updated mentor %s", user_id)
    return user_id


def get_mentor(mentor_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_client()
    doc = db.collection("mentors").document(mentor_id).get()
    return {"id": doc.id, **doc.to_dict()} if doc.exists else None


def list_mentors(
    expertise: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """List active mentors, optionally filtered by expertise tag."""
    db = get_firestore_client()
    q = db.collection("mentors").where(filter=FieldFilter("active", "==", True))
    if expertise:
        q = q.where(filter=FieldFilter("expertise", "array_contains", expertise))
    docs = list(q.order_by("rating", direction=firestore.Query.DESCENDING).offset(offset).limit(limit).stream())
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def create_mentorship_request(requester_id: str, mentor_id: str, data: Dict[str, Any]) -> str:
    """Submit a mentorship session request."""
    db = get_firestore_client()
    doc_ref = db.collection("mentorship_requests").document()
    doc_ref.set({
        **data,
        "requester_id": requester_id,
        "mentor_id": mentor_id,
        "status": "pending",   # pending | accepted | declined | completed
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("Mentorship request %s → mentor %s", doc_ref.id, mentor_id)
    return doc_ref.id


def get_mentorship_requests(user_id: str, as_mentor: bool = False) -> List[Dict[str, Any]]:
    """Fetch requests where user is the requester (or mentor if as_mentor=True)."""
    db = get_firestore_client()
    field = "mentor_id" if as_mentor else "requester_id"
    docs = (
        db.collection("mentorship_requests")
        .where(filter=FieldFilter(field, "==", user_id))
        .order_by("createdAt", direction=firestore.Query.DESCENDING)
        .limit(50)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def update_mentorship_request_status(request_id: str, status: str) -> None:
    db = get_firestore_client()
    db.collection("mentorship_requests").document(request_id).update({
        "status": status,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })


def add_mentor_review(mentor_id: str, reviewer_id: str, rating: float, comment: str) -> None:
    """Add a review and recompute the mentor's average rating."""
    db = get_firestore_client()
    review_ref = db.collection("mentors").document(mentor_id).collection("reviews").document()
    review_ref.set({
        "reviewer_id": reviewer_id,
        "rating": rating,
        "comment": comment,
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    # Recompute average
    reviews = list(db.collection("mentors").document(mentor_id).collection("reviews").stream())
    if reviews:
        avg = sum(r.to_dict().get("rating", 0) for r in reviews) / len(reviews)
        db.collection("mentors").document(mentor_id).update({
            "rating": round(avg, 2),
            "review_count": len(reviews),
        })


# ---------------------------------------------------------------------------
# Community Q&A Forum
# ---------------------------------------------------------------------------

def create_post(user_id: str, data: Dict[str, Any]) -> str:
    db = get_firestore_client()
    doc_ref = db.collection("community_posts").document()
    doc_ref.set({
        **data,
        "author_id": user_id,
        "upvotes": 0,
        "reply_count": 0,
        "voters": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("Community post %s by user %s", doc_ref.id, user_id)
    return doc_ref.id


def list_posts(tag: Optional[str] = None, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
    db = get_firestore_client()
    q = db.collection("community_posts")
    if tag:
        q = q.where(filter=FieldFilter("tags", "array_contains", tag))
    docs = list(q.order_by("createdAt", direction=firestore.Query.DESCENDING).offset(offset).limit(limit).stream())
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def get_post(post_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_client()
    doc = db.collection("community_posts").document(post_id).get()
    return {"id": doc.id, **doc.to_dict()} if doc.exists else None


def add_reply(post_id: str, user_id: str, content: str) -> str:
    db = get_firestore_client()
    reply_ref = db.collection("community_posts").document(post_id).collection("replies").document()
    reply_ref.set({
        "author_id": user_id,
        "content": content,
        "upvotes": 0,
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    # Increment reply_count
    db.collection("community_posts").document(post_id).update({
        "reply_count": firestore.Increment(1),
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    return reply_ref.id


def get_replies(post_id: str) -> List[Dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection("community_posts").document(post_id)
        .collection("replies")
        .order_by("createdAt")
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def vote_post(post_id: str, user_id: str) -> int:
    """Toggle upvote on a post. Returns new upvote count."""
    db = get_firestore_client()
    doc_ref = db.collection("community_posts").document(post_id)
    doc = doc_ref.get()
    if not doc.exists:
        return 0
    data = doc.to_dict()
    voters = data.get("voters", [])
    if user_id in voters:
        voters.remove(user_id)
        delta = -1
    else:
        voters.append(user_id)
        delta = 1
    new_count = data.get("upvotes", 0) + delta
    doc_ref.update({"upvotes": new_count, "voters": voters})
    return new_count


def delete_post(post_id: str) -> None:
    db = get_firestore_client()
    db.collection("community_posts").document(post_id).delete()


# ---------------------------------------------------------------------------
# Employer Partnerships
# ---------------------------------------------------------------------------

def create_employer(data: Dict[str, Any]) -> str:
    db = get_firestore_client()
    doc_ref = db.collection("employers").document()
    doc_ref.set({
        **data,
        "verified": False,
        "active": True,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("Employer created: %s", doc_ref.id)
    return doc_ref.id


def list_employers(career: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    db = get_firestore_client()
    q = db.collection("employers").where(filter=FieldFilter("active", "==", True))
    if career:
        q = q.where(filter=FieldFilter("hiring_for", "array_contains", career))
    docs = list(q.limit(limit).stream())
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def get_employer(employer_id: str) -> Optional[Dict[str, Any]]:
    db = get_firestore_client()
    doc = db.collection("employers").document(employer_id).get()
    return {"id": doc.id, **doc.to_dict()} if doc.exists else None


def update_employer(employer_id: str, data: Dict[str, Any]) -> None:
    db = get_firestore_client()
    db.collection("employers").document(employer_id).set(
        {**data, "updatedAt": firestore.SERVER_TIMESTAMP},
        merge=True,
    )


# ---------------------------------------------------------------------------
# Public API Key Management
# ---------------------------------------------------------------------------

import secrets


def generate_api_key(user_id: str, name: str) -> Dict[str, Any]:
    """Generate and store a new API key for the user. Returns the key (shown once)."""
    db = get_firestore_client()
    raw_key = "cra_" + secrets.token_urlsafe(32)
    doc_ref = db.collection("api_keys").document()
    doc_ref.set({
        "user_id": user_id,
        "name": name,
        "key_hash": _hash_api_key(raw_key),
        "key_preview": raw_key[:10] + "...",
        "request_count": 0,
        "last_used": None,
        "active": True,
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    logger.info("API key created for user %s — id=%s", user_id, doc_ref.id)
    return {"id": doc_ref.id, "key": raw_key, "name": name, "key_preview": raw_key[:10] + "..."}


def list_api_keys(user_id: str) -> List[Dict[str, Any]]:
    db = get_firestore_client()
    docs = (
        db.collection("api_keys")
        .where(filter=FieldFilter("user_id", "==", user_id))
        .where(filter=FieldFilter("active", "==", True))
        .stream()
    )
    return [{"id": doc.id, **{k: v for k, v in doc.to_dict().items() if k != "key_hash"}} for doc in docs]


def revoke_api_key(key_id: str, user_id: str) -> bool:
    db = get_firestore_client()
    doc = db.collection("api_keys").document(key_id).get()
    if not doc.exists or doc.to_dict().get("user_id") != user_id:
        return False
    db.collection("api_keys").document(key_id).update({"active": False})
    return True


def verify_api_key(raw_key: str) -> Optional[Dict[str, Any]]:
    """Verify an API key and return its metadata, or None if invalid."""
    db = get_firestore_client()
    key_hash = _hash_api_key(raw_key)
    docs = list(
        db.collection("api_keys")
        .where(filter=FieldFilter("key_hash", "==", key_hash))
        .where(filter=FieldFilter("active", "==", True))
        .limit(1)
        .stream()
    )
    if not docs:
        return None
    doc = docs[0]
    # Update usage stats
    db.collection("api_keys").document(doc.id).update({
        "request_count": firestore.Increment(1),
        "last_used": firestore.SERVER_TIMESTAMP,
    })
    return {"id": doc.id, **doc.to_dict()}


def _hash_api_key(raw_key: str) -> str:
    import hashlib
    return hashlib.sha256(raw_key.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Advanced Analytics — feedback topic analysis
# ---------------------------------------------------------------------------

def get_feedback_analytics(limit_sessions: int = 200) -> Dict[str, Any]:
    """Analyse feedback across recent sessions to surface recommendation quality patterns."""
    db = get_firestore_client()
    sessions = list(
        db.collection("sessions")
        .order_by("updatedAt", direction=firestore.Query.DESCENDING)
        .limit(limit_sessions)
        .stream()
    )

    stage_feedback: Dict[str, Dict[str, int]] = {}
    word_freq: Dict[str, int] = {}
    total_up = 0
    total_down = 0

    for session_doc in sessions:
        data = session_doc.to_dict()
        stage = data.get("stage", "discovery")
        feedbacks = data.get("feedbacks", [])

        for fb in feedbacks:
            rating = fb.get("rating", "")
            if rating == "thumbs_up":
                total_up += 1
                stage_feedback.setdefault(stage, {"up": 0, "down": 0})["up"] += 1
            elif rating == "thumbs_down":
                total_down += 1
                stage_feedback.setdefault(stage, {"up": 0, "down": 0})["down"] += 1
                # Extract keywords from negative feedback for improvement signal
                comment = fb.get("comment", "") + " " + fb.get("message_snapshot", "")
                for word in comment.lower().split():
                    if len(word) > 4:
                        word_freq[word] = word_freq.get(word, 0) + 1

    total = total_up + total_down
    top_negative_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]

    # Compute per-stage satisfaction rates
    stage_satisfaction = {}
    for stage, counts in stage_feedback.items():
        t = counts["up"] + counts["down"]
        stage_satisfaction[stage] = {
            "thumbs_up": counts["up"],
            "thumbs_down": counts["down"],
            "satisfaction_rate": round(counts["up"] / t * 100, 1) if t else 0,
        }

    return {
        "total_feedback_analysed": total,
        "overall_satisfaction": round(total_up / total * 100, 1) if total else 0,
        "stage_satisfaction": stage_satisfaction,
        "top_negative_keywords": [{"word": w, "count": c} for w, c in top_negative_keywords],
        "sessions_analysed": len(sessions),
    }


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
