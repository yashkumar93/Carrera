"""
Career Comparison Engine — compare 2-3 career paths side-by-side using
Gemini-enriched labor market data.  Returns structured data suitable
for chart rendering on the frontend.
"""
import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List

from google import genai

from app.config import settings
from app.middleware.auth import get_current_user
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()

gemini_client = None
if settings.gemini_api_key:
    gemini_client = genai.Client(api_key=settings.gemini_api_key)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CompareRequest(BaseModel):
    careers: List[str] = Field(..., min_length=2, description="2–3 career names to compare")
    user_skills: List[str] = Field(default=[], description="User's current skills for fit scoring")


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

COMPARE_PROMPT = """You are a career data analyst. Compare these {n} careers using realistic labor market data:
{careers}

User's current skills: {skills}

Return a JSON object (raw JSON only, no markdown):
{{
  "careers": [
    {{
      "name": "career name",
      "median_salary_usd": <annual median in USD as integer>,
      "salary_range": {{"min": <int>, "max": <int>}},
      "demand_growth_pct": <5-year projected % growth as float, negative if declining>,
      "demand_label": "Fast Growing | Growing | Stable | Declining",
      "required_education": "High School | Associate | Bachelor | Master | PhD | Bootcamp",
      "avg_time_to_entry_months": <int>,
      "key_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "transferable_from_user": ["skills the user already has that apply"],
      "skills_to_learn": ["top 3 skills user needs to gain"],
      "fit_score": <int 1-10 based on user skills match>,
      "job_openings_estimate": "e.g. ~150,000/yr in US",
      "top_industries": ["industry1", "industry2", "industry3"],
      "remote_friendly": true,
      "pros": ["pro1", "pro2", "pro3"],
      "cons": ["con1", "con2"],
      "summary": "2-sentence overview of this career"
    }}
  ],
  "recommendation": {{
    "best_fit": "career name with best user fit score",
    "best_salary": "career name with highest median salary",
    "fastest_entry": "career name with shortest time to entry",
    "reasoning": "2–3 sentence personalised comparison summary for this specific user"
  }},
  "data_note": "Salary and demand figures are estimates based on general market data (2024–2025). Verify with BLS.gov or industry reports for current figures."
}}"""


def _call_gemini(prompt: str):
    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    try:
        response = gemini_client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please retry.")
    except Exception as exc:
        logger.error("Gemini compare failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI service error. Please retry.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/compare")
async def compare_careers(body: CompareRequest, user: Dict = Depends(get_current_user)):
    """
    Compare 2–3 career paths side-by-side.
    Returns salary, demand, skills gap, fit score, and pros/cons for each.
    """
    if len(body.careers) < 2 or len(body.careers) > 3:
        raise HTTPException(status_code=422, detail="Provide 2 or 3 careers to compare")

    # Deduplicate and trim
    careers = list(dict.fromkeys(c.strip() for c in body.careers if c.strip()))

    # Enrich user skills from their profile if not provided
    skills = body.user_skills
    if not skills:
        profile = firestore_service.get_user_profile(user["uid"])
        skills = profile.get("skills", []) if profile else []

    prompt = COMPARE_PROMPT.format(
        n=len(careers),
        careers="\n".join(f"- {c}" for c in careers),
        skills=", ".join(skills) if skills else "not specified",
    )

    result = _call_gemini(prompt)
    logger.info("Career comparison for user %s: %s", user["uid"], careers)
    return result
