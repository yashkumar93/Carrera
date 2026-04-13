"""
Community Q&A Forum — posts, replies, voting.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

from app.middleware.auth import get_current_user
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_TAGS = {
    "career-advice", "tech", "data-science", "design", "finance",
    "entrepreneurship", "certifications", "internships", "salary",
    "study-tips", "interview-prep", "general",
}


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class NewPostRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10, max_length=2000)
    tags: List[str] = Field(default=["general"], description="1–3 topic tags")


class NewReplyRequest(BaseModel):
    content: str = Field(..., min_length=2, max_length=1000)


# ---------------------------------------------------------------------------
# Posts
# ---------------------------------------------------------------------------

@router.post("/community/posts")
async def create_post(body: NewPostRequest, user: Dict = Depends(get_current_user)):
    """Create a new community Q&A post."""
    # Normalise and validate tags
    tags = [t.lower().strip() for t in body.tags[:3]]
    tags = [t if t in VALID_TAGS else "general" for t in tags] or ["general"]

    post_id = firestore_service.create_post(user["uid"], {
        "title": body.title,
        "content": body.content,
        "tags": tags,
        "author_name": user.get("name") or user.get("email", "Anonymous"),
    })
    return {"message": "Post created", "post_id": post_id}


@router.get("/community/posts")
async def list_posts(
    tag: Optional[str] = Query(None, description="Filter by tag"),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    user: Dict = Depends(get_current_user),
):
    """List community posts, newest first."""
    posts = firestore_service.list_posts(tag=tag, limit=limit, offset=offset)
    return {"posts": posts, "total": len(posts)}


@router.get("/community/posts/{post_id}")
async def get_post(post_id: str, user: Dict = Depends(get_current_user)):
    """Get a single post with its replies."""
    post = firestore_service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    replies = firestore_service.get_replies(post_id)
    return {**post, "replies": replies}


@router.delete("/community/posts/{post_id}")
async def delete_post(post_id: str, user: Dict = Depends(get_current_user)):
    """Delete a post (author or admin only)."""
    post = firestore_service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.get("author_id") != user["uid"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorised to delete this post")
    firestore_service.delete_post(post_id)
    return {"message": "Post deleted"}


# ---------------------------------------------------------------------------
# Replies
# ---------------------------------------------------------------------------

@router.post("/community/posts/{post_id}/replies")
async def add_reply(
    post_id: str,
    body: NewReplyRequest,
    user: Dict = Depends(get_current_user),
):
    """Add a reply to a post."""
    post = firestore_service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    reply_id = firestore_service.add_reply(post_id, user["uid"], body.content)
    return {"message": "Reply added", "reply_id": reply_id}


# ---------------------------------------------------------------------------
# Voting
# ---------------------------------------------------------------------------

@router.post("/community/posts/{post_id}/vote")
async def vote_post(post_id: str, user: Dict = Depends(get_current_user)):
    """Toggle an upvote on a post. Returns the new upvote count."""
    post = firestore_service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    new_count = firestore_service.vote_post(post_id, user["uid"])
    return {"upvotes": new_count}


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

@router.get("/community/tags")
async def get_tags(user: Dict = Depends(get_current_user)):
    """Return the list of valid community tags."""
    return {"tags": sorted(VALID_TAGS)}
