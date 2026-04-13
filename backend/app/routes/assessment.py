"""
Aptitude assessment endpoints — generate scored career-fit quizzes,
score user responses, produce skill gap reports, and persist results.
"""
import json
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

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
# Request / Response models
# ---------------------------------------------------------------------------

class GenerateAssessmentRequest(BaseModel):
    career: str = Field(..., min_length=2, max_length=100, description="Target career path")
    num_questions: int = Field(default=12, ge=5, le=15, description="Number of questions (5–15)")


class AssessmentAnswer(BaseModel):
    question_id: int
    answer: str  # User's chosen option text


class ScoreAssessmentRequest(BaseModel):
    career: str = Field(..., min_length=2, max_length=100)
    questions: List[Dict] = Field(..., description="Original questions from generate endpoint")
    answers: List[AssessmentAnswer] = Field(..., description="User's submitted answers")


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

GENERATE_PROMPT = """You are a career assessment expert. Generate a {num_questions}-question aptitude quiz to evaluate whether someone is suited for the role of {career}.

Include a mix of:
- Technical knowledge questions (40%)
- Soft skills / personality questions (30%)
- Situational judgment questions (30%)

Return a JSON array with EXACTLY this structure (raw JSON only, no markdown):
[
  {{
    "id": 1,
    "question": "question text",
    "type": "technical | soft_skill | situational",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option X",
    "skill_area": "e.g. problem-solving, communication, data analysis",
    "explanation": "why this answer is correct / what it measures"
  }}
]

Make questions realistic and relevant to the {career} role. Ensure each question has exactly 4 options."""


SCORE_PROMPT = """You are a career assessment scorer. A user completed a {num_q}-question quiz for the career: {career}.

Questions and answers:
{qa_pairs}

Score the assessment and return a JSON object (raw JSON only, no markdown):
{{
  "career": "{career}",
  "total_questions": {num_q},
  "correct_count": <int>,
  "score_percent": <float 0-100>,
  "fit_level": "Strong Fit | Moderate Fit | Needs Development | Not Recommended",
  "skill_scores": {{
    "<skill_area>": {{
      "score": <float 0-100>,
      "questions_count": <int>,
      "level": "Strong | Moderate | Weak"
    }}
  }},
  "strengths": ["strength 1", "strength 2"],
  "gaps": ["gap 1", "gap 2"],
  "priority_learning": [
    {{
      "area": "skill area",
      "action": "specific learning recommendation",
      "resources": ["resource 1", "resource 2"]
    }}
  ],
  "summary": "2-3 sentence personalized summary of results",
  "recommended_next_step": "one concrete action to take this week"
}}"""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _call_gemini_json(prompt: str) -> any:
    """Call Gemini and parse the JSON response."""
    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI service not configured")
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Gemini non-JSON response: %s", exc)
        raise HTTPException(status_code=502, detail="AI returned invalid JSON. Please retry.")
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI service error. Please retry.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/assessment/generate")
async def generate_assessment(
    body: GenerateAssessmentRequest,
    user: Dict = Depends(get_current_user),
):
    """
    Generate a {num_questions}-question aptitude quiz for a target career.
    Returns questions with options; correct answers included so the frontend
    can optionally show explanations after submission.
    """
    prompt = GENERATE_PROMPT.format(
        num_questions=body.num_questions,
        career=body.career,
    )
    questions = _call_gemini_json(prompt)

    if not isinstance(questions, list):
        raise HTTPException(status_code=502, detail="Unexpected AI response format")

    logger.info("Generated %d assessment questions for '%s' (user %s)", len(questions), body.career, user["uid"])
    return {
        "career": body.career,
        "questions": questions,
        "total": len(questions),
    }


@router.post("/assessment/score")
async def score_assessment(
    body: ScoreAssessmentRequest,
    user: Dict = Depends(get_current_user),
):
    """
    Score a completed assessment. Accepts the original questions and user answers,
    returns a detailed skill gap report and fit level.
    """
    # Build Q&A pairs for the prompt
    qa_pairs = []
    answer_map = {a.question_id: a.answer for a in body.answers}
    for q in body.questions:
        qid = q.get("id")
        user_ans = answer_map.get(qid, "Not answered")
        correct = q.get("correct_answer", "")
        qa_pairs.append(
            f"Q{qid} [{q.get('skill_area', '')}]: {q.get('question', '')}\n"
            f"  User answered: {user_ans}\n"
            f"  Correct answer: {correct}"
        )

    prompt = SCORE_PROMPT.format(
        career=body.career,
        num_q=len(body.questions),
        qa_pairs="\n\n".join(qa_pairs),
    )

    result = _call_gemini_json(prompt)
    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Unexpected AI response format")

    # Persist result to Firestore
    assessment_id = firestore_service.save_assessment_result(user["uid"], result)
    result["assessment_id"] = assessment_id

    logger.info(
        "Assessment scored for user %s — career=%s score=%.1f%% fit=%s",
        user["uid"], body.career, result.get("score_percent", 0), result.get("fit_level", "?")
    )
    return result


@router.get("/assessment/history")
async def get_assessment_history(user: Dict = Depends(get_current_user)):
    """Return the user's past assessment results, newest first."""
    history = firestore_service.get_assessment_history(user["uid"])
    return {"assessments": history, "total": len(history)}
