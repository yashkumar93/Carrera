"""
Resume parsing — upload a PDF resume, extract text with pdfplumber,
use Gemini to extract structured skills/experience/education, and
map extracted skills to career paths.
"""
import io
import json
import logging
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import Dict

from google import genai

from app.config import settings
from app.middleware.auth import get_current_user
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()

gemini_client = None
if settings.gemini_api_key:
    gemini_client = genai.Client(api_key=settings.gemini_api_key)

MAX_PDF_SIZE_MB = 5
ALLOWED_TYPES = {"application/pdf", "application/octet-stream"}

RESUME_EXTRACTION_PROMPT = """You are an expert resume parser. Analyze the following resume text and extract structured information.

Resume text:
{resume_text}

Return a JSON object with EXACTLY this structure (no markdown, no extra text — raw JSON only):
{{
  "name": "full name or null",
  "email": "email or null",
  "phone": "phone or null",
  "summary": "brief professional summary (1-2 sentences) or null",
  "education": [
    {{
      "degree": "degree name",
      "field": "field of study",
      "institution": "school name",
      "year": "graduation year or null"
    }}
  ],
  "experience": [
    {{
      "title": "job title",
      "company": "company name",
      "duration": "e.g. 2021-2023",
      "description": "brief description of responsibilities"
    }}
  ],
  "skills": ["skill1", "skill2", "..."],
  "certifications": ["cert1", "cert2"],
  "languages": ["language1", "language2"],
  "career_interests_inferred": ["inferred interest 1", "inferred interest 2"],
  "experience_level": "entry / mid / senior / executive",
  "transferable_skills": [
    {{
      "skill": "skill name",
      "target_careers": ["career1", "career2"],
      "strength": "high / medium / low"
    }}
  ],
  "recommended_careers": [
    {{
      "career": "career name",
      "fit_reason": "one sentence why this career fits",
      "skill_gap": ["missing skill 1", "missing skill 2"]
    }}
  ]
}}"""


def _extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from a PDF using pdfplumber."""
    try:
        import pdfplumber
        text_parts = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except Exception as exc:
        logger.error("PDF text extraction failed: %s", exc)
        raise HTTPException(status_code=422, detail=f"Could not extract text from PDF: {exc}")


def _parse_resume_with_gemini(resume_text: str) -> Dict:
    """Send extracted text to Gemini for structured analysis."""
    if not gemini_client:
        raise HTTPException(status_code=503, detail="AI service not configured")

    if not resume_text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the PDF")

    # Limit input to avoid token overflow
    truncated = resume_text[:8000]

    prompt = RESUME_EXTRACTION_PROMPT.format(resume_text=truncated)
    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw = response.text.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        return json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.error("Gemini returned non-JSON for resume: %s", exc)
        raise HTTPException(status_code=502, detail="AI response was not valid JSON. Please try again.")
    except Exception as exc:
        logger.error("Gemini resume parsing failed: %s", exc)
        raise HTTPException(status_code=502, detail="AI analysis failed. Please try again.")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/resume/parse")
async def parse_resume(
    file: UploadFile = File(..., description="PDF resume (max 5 MB)"),
    user: Dict = Depends(get_current_user),
):
    """
    Upload a PDF resume. Returns structured extraction: skills, experience,
    education, transferable skills, and recommended careers.
    Saves the analysis to the user's profile automatically.
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES and not (file.filename or "").endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Only PDF files are supported")

    # Read and size-check
    pdf_bytes = await file.read()
    size_mb = len(pdf_bytes) / (1024 * 1024)
    if size_mb > MAX_PDF_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"PDF too large ({size_mb:.1f} MB). Maximum allowed is {MAX_PDF_SIZE_MB} MB."
        )

    # Extract text
    resume_text = _extract_text_from_pdf(pdf_bytes)

    # Parse with Gemini
    analysis = _parse_resume_with_gemini(resume_text)

    # Auto-update profile with extracted data
    profile_updates = {}
    if analysis.get("skills"):
        profile_updates["skills"] = analysis["skills"]
    if analysis.get("education"):
        edu = analysis["education"]
        if edu:
            latest = edu[-1]
            profile_updates["education"] = f"{latest.get('degree', '')} in {latest.get('field', '')} from {latest.get('institution', '')}".strip(" in from")
    if analysis.get("experience_level"):
        profile_updates["experience_level"] = analysis["experience_level"]
    if analysis.get("career_interests_inferred"):
        profile_updates["career_interests"] = analysis["career_interests_inferred"]

    if profile_updates:
        firestore_service.update_user_profile(user["uid"], profile_updates)

    # Save full analysis
    firestore_service.save_resume_analysis(user["uid"], analysis)

    logger.info("Resume parsed for user %s — %d skills extracted", user["uid"], len(analysis.get("skills", [])))
    return {
        "message": "Resume parsed successfully",
        "analysis": analysis,
        "profile_updated": bool(profile_updates),
    }


@router.get("/resume/analysis")
async def get_resume_analysis(user: Dict = Depends(get_current_user)):
    """Retrieve the most recent resume analysis saved for this user."""
    profile = firestore_service.get_user_profile(user["uid"])
    if not profile or "resume_analysis" not in profile:
        raise HTTPException(status_code=404, detail="No resume analysis found. Upload a resume first.")
    return {"analysis": profile["resume_analysis"]}
