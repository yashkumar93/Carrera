"""
Public Third-party API — API key management and public /v1/* endpoints.
Developers can integrate Careerra's career suggestion and assessment
capabilities into their own apps using a generated API key.
"""
import json
import logging
from fastapi import APIRouter, HTTPException, Header, Depends, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

from app.middleware.auth import get_current_user
from app.services import firestore_service
from app.services import llm_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CreateKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=80, description="Human-readable key name")


class CareerSuggestRequest(BaseModel):
    interests: List[str] = Field(..., description="User interests e.g. ['coding', 'design']")
    skills: Optional[List[str]] = Field(default=[])
    education: Optional[str] = Field(None)
    experience_level: Optional[str] = Field(None, description="student | entry | mid | senior")
    max_results: int = Field(default=3, ge=1, le=5)


# ---------------------------------------------------------------------------
# API key auth dependency
# ---------------------------------------------------------------------------

async def get_api_key_user(x_api_key: Optional[str] = Header(None)) -> Dict:
    """Validate the X-API-Key header and return key metadata."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-API-Key header. Generate a key at /api/keys.",
        )
    key_data = firestore_service.verify_api_key(x_api_key)
    if not key_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key.",
        )
    return key_data


# ---------------------------------------------------------------------------
# Key management (authenticated users)
# ---------------------------------------------------------------------------

@router.post("/keys")
async def create_api_key(body: CreateKeyRequest, user: Dict = Depends(get_current_user)):
    """Generate a new API key (shown only once — save it immediately)."""
    existing = firestore_service.list_api_keys(user["uid"])
    if len(existing) >= 5:
        raise HTTPException(status_code=429, detail="Maximum 5 API keys per account. Revoke one first.")
    key_info = firestore_service.generate_api_key(user["uid"], body.name)
    return {
        "message": "API key created. Copy it now — it will not be shown again.",
        **key_info,
    }


@router.get("/keys")
async def list_api_keys(user: Dict = Depends(get_current_user)):
    """List your active API keys (key values are not shown)."""
    keys = firestore_service.list_api_keys(user["uid"])
    return {"keys": keys}


@router.delete("/keys/{key_id}")
async def revoke_api_key(key_id: str, user: Dict = Depends(get_current_user)):
    """Revoke (deactivate) an API key."""
    success = firestore_service.revoke_api_key(key_id, user["uid"])
    if not success:
        raise HTTPException(status_code=404, detail="Key not found or not owned by you")
    return {"message": "API key revoked"}


# ---------------------------------------------------------------------------
# Public v1 endpoints (API key auth)
# ---------------------------------------------------------------------------

SUGGEST_PROMPT = """You are a career advisor API. Given this user profile, suggest {max_results} career paths.

Profile:
- Interests: {interests}
- Skills: {skills}
- Education: {education}
- Experience level: {experience_level}

Return a JSON array (raw JSON only, no markdown):
[
  {{
    "career": "career name",
    "fit_score": <int 1-10>,
    "salary_range": "e.g. $60k-$100k/yr (estimate)",
    "demand_trend": "Growing | Stable | Declining",
    "key_skills": ["skill1", "skill2", "skill3"],
    "fit_reason": "1-2 sentence rationale",
    "time_to_entry": "e.g. 6 months | 1-2 years | 3-4 years"
  }}
]"""


@router.post("/v1/careers/suggest")
async def public_suggest_careers(
    body: CareerSuggestRequest,
    key_data: Dict = Depends(get_api_key_user),
):
    """
    **Public API** — Suggest career paths based on a user profile.
    Requires `X-API-Key` header. Generate a key at `POST /api/keys`.
    """
    if not llm_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")

    prompt = SUGGEST_PROMPT.format(
        max_results=body.max_results,
        interests=", ".join(body.interests) or "not specified",
        skills=", ".join(body.skills) if body.skills else "not specified",
        education=body.education or "not specified",
        experience_level=body.experience_level or "not specified",
    )

    try:
        raw = llm_service.generate_text(prompt).strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        careers = json.loads(raw)
    except Exception as exc:
        logger.error("Public API career suggest failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI generation failed. Please retry.")

    logger.info("Public API career suggest — key=%s results=%d", key_data["id"], len(careers))
    return {
        "careers": careers,
        "disclaimer": "Salary estimates are approximate. Verify with current market data.",
        "powered_by": "Careerra API v1",
    }


@router.get("/v1/health")
async def public_health(key_data: Dict = Depends(get_api_key_user)):
    """**Public API** — Confirm your API key is valid and the service is up."""
    return {
        "status": "ok",
        "key_name": key_data.get("name"),
        "request_count": key_data.get("request_count", 0),
        "powered_by": "Careerra API v1",
    }
