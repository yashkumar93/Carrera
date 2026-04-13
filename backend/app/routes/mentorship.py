"""
Mentorship Marketplace — mentor registration, discovery, session requests, reviews.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

from app.middleware.auth import get_current_user
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class MentorProfileRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    bio: str = Field(..., min_length=10, max_length=800)
    expertise: List[str] = Field(..., min_length=1, description="List of expertise tags e.g. ['Data Science', 'Python']")
    experience_years: int = Field(..., ge=0, le=50)
    availability: str = Field(..., description="e.g. 'Weekends', '2 hours/week'")
    pricing: str = Field(default="Free", description="e.g. 'Free', '$50/hr', 'Pay what you can'")
    linkedin_url: Optional[str] = Field(None, max_length=200)
    languages: Optional[List[str]] = Field(default=["English"])


class MentorshipRequestModel(BaseModel):
    message: str = Field(..., min_length=10, max_length=600, description="Why you want mentorship")
    goals: str = Field(..., min_length=5, max_length=400, description="What you hope to achieve")
    preferred_schedule: Optional[str] = Field(None, max_length=100)


class RequestStatusUpdate(BaseModel):
    status: str = Field(..., description="accepted | declined | completed")


class ReviewRequest(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    comment: str = Field(..., min_length=5, max_length=500)


# ---------------------------------------------------------------------------
# Mentor profile management
# ---------------------------------------------------------------------------

@router.post("/mentors/register")
async def register_as_mentor(
    body: MentorProfileRequest,
    user: Dict = Depends(get_current_user),
):
    """Register the current user as a mentor (or update existing profile)."""
    data = body.model_dump()
    firestore_service.register_mentor(user["uid"], data)
    return {"message": "Mentor profile saved", "mentor_id": user["uid"]}


@router.get("/mentors")
async def list_mentors(
    expertise: Optional[str] = Query(None, description="Filter by expertise tag"),
    limit: int = Query(default=20, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    user: Dict = Depends(get_current_user),
):
    """Browse all active mentors, optionally filtered by expertise."""
    mentors = firestore_service.list_mentors(expertise=expertise, limit=limit, offset=offset)
    return {"mentors": mentors, "total": len(mentors)}


@router.get("/mentors/me")
async def get_my_mentor_profile(user: Dict = Depends(get_current_user)):
    """Get the current user's mentor profile (if registered)."""
    profile = firestore_service.get_mentor(user["uid"])
    if not profile:
        raise HTTPException(status_code=404, detail="You are not registered as a mentor")
    return profile


@router.get("/mentors/{mentor_id}")
async def get_mentor(mentor_id: str, user: Dict = Depends(get_current_user)):
    """Get a specific mentor's public profile."""
    mentor = firestore_service.get_mentor(mentor_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return mentor


# ---------------------------------------------------------------------------
# Mentorship requests
# ---------------------------------------------------------------------------

@router.post("/mentors/{mentor_id}/request")
async def request_mentorship(
    mentor_id: str,
    body: MentorshipRequestModel,
    user: Dict = Depends(get_current_user),
):
    """Send a mentorship session request to a mentor."""
    mentor = firestore_service.get_mentor(mentor_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    if mentor_id == user["uid"]:
        raise HTTPException(status_code=400, detail="You cannot request mentorship from yourself")

    request_id = firestore_service.create_mentorship_request(
        user["uid"], mentor_id, body.model_dump()
    )
    return {"message": "Request sent", "request_id": request_id}


@router.get("/mentors/requests/sent")
async def get_my_sent_requests(user: Dict = Depends(get_current_user)):
    """Get mentorship requests sent by the current user."""
    requests = firestore_service.get_mentorship_requests(user["uid"], as_mentor=False)
    return {"requests": requests}


@router.get("/mentors/requests/received")
async def get_my_received_requests(user: Dict = Depends(get_current_user)):
    """Get mentorship requests received (as a mentor)."""
    requests = firestore_service.get_mentorship_requests(user["uid"], as_mentor=True)
    return {"requests": requests}


@router.patch("/mentors/requests/{request_id}/status")
async def update_request_status(
    request_id: str,
    body: RequestStatusUpdate,
    user: Dict = Depends(get_current_user),
):
    """Accept, decline, or mark a mentorship request as completed (mentor only)."""
    valid = {"accepted", "declined", "completed"}
    if body.status not in valid:
        raise HTTPException(status_code=422, detail=f"Status must be one of: {valid}")
    firestore_service.update_mentorship_request_status(request_id, body.status)
    return {"message": f"Request marked as {body.status}"}


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@router.post("/mentors/{mentor_id}/review")
async def add_review(
    mentor_id: str,
    body: ReviewRequest,
    user: Dict = Depends(get_current_user),
):
    """Leave a rating and comment for a mentor after a completed session."""
    if mentor_id == user["uid"]:
        raise HTTPException(status_code=400, detail="You cannot review yourself")
    mentor = firestore_service.get_mentor(mentor_id)
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    firestore_service.add_mentor_review(mentor_id, user["uid"], body.rating, body.comment)
    return {"message": "Review submitted"}
