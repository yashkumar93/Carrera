"""
Employer Partnerships — company profiles, open roles, hiring signals
linked to career recommendations.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

from app.middleware.auth import get_current_user, require_admin
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class EmployerRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    industry: str = Field(..., min_length=2, max_length=100)
    description: str = Field(..., min_length=10, max_length=800)
    hiring_for: List[str] = Field(..., description="Career paths this employer is actively hiring for")
    open_roles: List[Dict] = Field(
        default=[],
        description="List of open roles: [{title, location, type, url}]",
    )
    company_size: Optional[str] = Field(None, description="e.g. '10-50', '500-1000', '10000+'")
    website: Optional[str] = Field(None, max_length=200)
    logo_url: Optional[str] = Field(None, max_length=300)
    locations: Optional[List[str]] = Field(default=[])
    remote_friendly: bool = Field(default=False)


# ---------------------------------------------------------------------------
# Admin dependency
# ---------------------------------------------------------------------------

async def admin_user(user: Dict = Depends(get_current_user)) -> Dict:
    return await require_admin(user)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/employers")
async def list_employers(
    career: Optional[str] = Query(None, description="Filter by career path (e.g. 'Data Scientist')"),
    limit: int = Query(default=20, ge=1, le=50),
    user: Dict = Depends(get_current_user),
):
    """Browse active employer profiles, optionally filtered by career path."""
    employers = firestore_service.list_employers(career=career, limit=limit)
    return {"employers": employers, "total": len(employers)}


@router.get("/employers/{employer_id}")
async def get_employer(employer_id: str, user: Dict = Depends(get_current_user)):
    """Get a specific employer's full profile and open roles."""
    employer = firestore_service.get_employer(employer_id)
    if not employer:
        raise HTTPException(status_code=404, detail="Employer not found")
    return employer


@router.post("/employers")
async def create_employer(body: EmployerRequest, user: Dict = Depends(admin_user)):
    """Create a new employer profile (admin only)."""
    employer_id = firestore_service.create_employer(body.model_dump())
    return {"message": "Employer created", "employer_id": employer_id}


@router.patch("/employers/{employer_id}")
async def update_employer(
    employer_id: str,
    body: EmployerRequest,
    user: Dict = Depends(admin_user),
):
    """Update an employer profile (admin only)."""
    existing = firestore_service.get_employer(employer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Employer not found")
    firestore_service.update_employer(employer_id, body.model_dump())
    return {"message": "Employer updated"}


@router.patch("/employers/{employer_id}/verify")
async def verify_employer(employer_id: str, user: Dict = Depends(admin_user)):
    """Mark an employer as verified (admin only)."""
    existing = firestore_service.get_employer(employer_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Employer not found")
    firestore_service.update_employer(employer_id, {"verified": True})
    return {"message": "Employer verified"}
