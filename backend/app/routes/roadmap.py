"""
Learning Roadmap — Kanban-style milestone tracking.
Users can generate AI roadmaps from a career goal, then manage items
across To Do / In Progress / Completed columns.
"""
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

from app.middleware.auth import get_current_user
from app.services import firestore_service
from app.services import llm_service

logger = logging.getLogger(__name__)
router = APIRouter()

VALID_STATUSES = {"todo", "in_progress", "completed"}

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class GenerateRoadmapRequest(BaseModel):
    career_goal: str = Field(..., min_length=1, max_length=500)
    timeline_months: int = Field(default=6, ge=1, le=24)


class RoadmapItemCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    category: str = Field(default="general",
                          description="course | project | certification | skill | milestone")
    week: Optional[int] = Field(None, ge=1, le=52, description="Target week number")
    status: str = Field(default="todo")


class RoadmapItemUpdate(BaseModel):
    status: Optional[str] = None
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    week: Optional[int] = Field(None, ge=1, le=52)


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

ROADMAP_PROMPT = """You are a career coach. Generate a {months}-month learning roadmap for someone targeting: {goal}

Their current skills: {skills}

Return a JSON array of roadmap items (raw JSON only, no markdown):
[
  {{
    "title": "item title (concise action)",
    "description": "what to do and why it matters",
    "category": "course | project | certification | skill | milestone",
    "week": <week number 1-{max_week}>,
    "priority": "high | medium | low",
    "estimated_hours": <int hours to complete>,
    "resources": ["resource name or platform"]
  }}
]

Guidelines:
- Generate 12–18 items spread across the timeline
- Mix: 40% courses, 25% projects, 20% skills, 15% certifications/milestones
- Order by week (week 1 = start now)
- Each item must be specific and actionable
- First 4 weeks: foundational items; middle: building; final: portfolio/job-ready"""


# ---------------------------------------------------------------------------
# Firestore helpers
# ---------------------------------------------------------------------------

def _roadmap_col(user_id: str):
    from app.services.firestore_service import get_firestore_client
    return get_firestore_client().collection("users").document(user_id).collection("roadmap")


def _get_items(user_id: str) -> List[Dict]:
    docs = _roadmap_col(user_id).order_by("week").stream()
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


def _create_item(user_id: str, data: Dict) -> str:
    from firebase_admin import firestore as fb
    doc_ref = _roadmap_col(user_id).document()
    doc_ref.set({**data, "createdAt": fb.SERVER_TIMESTAMP})
    return doc_ref.id


def _update_item(user_id: str, item_id: str, data: Dict) -> bool:
    from firebase_admin import firestore as fb
    doc_ref = _roadmap_col(user_id).document(item_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.update({**data, "updatedAt": fb.SERVER_TIMESTAMP})
    return True


def _delete_item(user_id: str, item_id: str) -> bool:
    doc_ref = _roadmap_col(user_id).document(item_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/roadmap/generate")
async def generate_roadmap(body: GenerateRoadmapRequest, user: Dict = Depends(get_current_user)):
    """
    Generate a personalised learning roadmap using Groq.
    Saves items to the user's roadmap collection (all as 'todo').
    Returns the generated items.
    """
    if not llm_service.is_configured():
        raise HTTPException(status_code=503, detail="AI service not configured")

    profile = firestore_service.get_user_profile(user["uid"]) or {}
    skills = profile.get("skills", [])

    max_week = body.timeline_months * 4
    prompt = ROADMAP_PROMPT.format(
        months=body.timeline_months,
        goal=body.career_goal,
        skills=", ".join(skills) if skills else "not specified",
        max_week=max_week,
    )

    try:
        raw = llm_service.generate_text(prompt).strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        items = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please retry.")
    except Exception as exc:
        logger.error("Roadmap generation failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI service error. Please retry.")

    # Save each item with status=todo
    saved_ids = []
    for item in items:
        item_id = _create_item(user_id=user["uid"], data={
            **item,
            "status": "todo",
            "career_goal": body.career_goal,
        })
        saved_ids.append(item_id)

    logger.info("Generated %d roadmap items for user %s — goal: %s", len(items), user["uid"], body.career_goal)
    return {
        "message": f"Roadmap generated with {len(items)} items",
        "career_goal": body.career_goal,
        "items": [{**item, "id": saved_ids[i]} for i, item in enumerate(items)],
    }


@router.get("/roadmap")
async def get_roadmap(user: Dict = Depends(get_current_user)):
    """Return all roadmap items for the user, grouped by status."""
    items = _get_items(user["uid"])
    todo = [i for i in items if i.get("status") == "todo"]
    in_progress = [i for i in items if i.get("status") == "in_progress"]
    completed = [i for i in items if i.get("status") == "completed"]

    total = len(items)
    completion_pct = round(len(completed) / total * 100) if total else 0

    return {
        "todo": todo,
        "in_progress": in_progress,
        "completed": completed,
        "total": total,
        "completion_pct": completion_pct,
    }


@router.post("/roadmap/items")
async def add_roadmap_item(body: RoadmapItemCreate, user: Dict = Depends(get_current_user)):
    """Manually add a single item to the roadmap."""
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
    item_id = _create_item(user["uid"], body.model_dump())
    return {"message": "Item added", "id": item_id}


@router.patch("/roadmap/items/{item_id}")
async def update_roadmap_item(
    item_id: str,
    body: RoadmapItemUpdate,
    user: Dict = Depends(get_current_user),
):
    """Update a roadmap item (status, title, description, week)."""
    data = body.model_dump(exclude_none=True)
    if "status" in data and data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
    success = _update_item(user["uid"], item_id, data)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item updated"}


@router.delete("/roadmap/items/{item_id}")
async def delete_roadmap_item(item_id: str, user: Dict = Depends(get_current_user)):
    """Remove an item from the roadmap."""
    success = _delete_item(user["uid"], item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted"}


@router.delete("/roadmap")
async def clear_roadmap(user: Dict = Depends(get_current_user)):
    """Delete all roadmap items (to start fresh with a new goal)."""
    items = _get_items(user["uid"])
    for item in items:
        _delete_item(user["uid"], item["id"])
    return {"message": f"Cleared {len(items)} items"}
