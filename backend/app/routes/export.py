"""
PDF Export — generate a downloadable career plan PDF for a session.
Uses fpdf2 (pure Python, no wkhtmltopdf dependency).
"""
import io
import logging
import textwrap
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Dict

from fpdf import FPDF

from app.middleware.auth import get_current_user
from app.services import firestore_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Purple brand colour (R, G, B)
BRAND = (168, 85, 247)
DARK = (15, 15, 15)
GREY = (100, 100, 100)
LIGHT = (230, 230, 230)


def _wrap(text: str, width: int = 90) -> str:
    """Wrap long text to fixed width for PDF rendering."""
    return "\n".join(textwrap.wrap(text, width=width))


def _build_pdf(session: Dict, profile: Dict) -> bytes:
    """Build a formatted PDF and return its bytes."""
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_margins(20, 20, 20)

    # ── Header ──────────────────────────────────────────────────────────────
    pdf.set_fill_color(*BRAND)
    pdf.rect(0, 0, 210, 28, style="F")

    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(20, 8)
    pdf.cell(0, 10, "Careerra — Career Plan", ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(20, 19)
    pdf.cell(0, 6, f"Generated {datetime.utcnow().strftime('%B %d, %Y')}  ·  AI advice supplements professional counseling", ln=True)

    pdf.set_y(35)

    # ── Session title & stage ───────────────────────────────────────────────
    title = session.get("title", "Career Counseling Session")
    stage = session.get("stage", "discovery").title()

    pdf.set_text_color(30, 30, 30)
    pdf.set_font("Helvetica", "B", 15)
    pdf.cell(0, 8, _wrap(title, 80), ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*GREY)
    pdf.cell(0, 5, f"Stage: {stage}", ln=True)
    pdf.ln(4)

    # ── Profile summary ─────────────────────────────────────────────────────
    if profile:
        pdf.set_fill_color(245, 240, 255)
        pdf.set_draw_color(*BRAND)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*BRAND)
        pdf.cell(0, 8, "Your Profile", ln=True)

        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 30, 30)

        rows = [
            ("Name", profile.get("name", "—")),
            ("Education", profile.get("education", "—")),
            ("Experience", profile.get("experience_level", "—")),
            ("Career Interests", ", ".join(profile.get("career_interests", [])) or "—"),
            ("Skills", ", ".join(profile.get("skills", [])) or "—"),
        ]
        for label, value in rows:
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(40, 6, label + ":", border=0)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 6, _wrap(str(value), 100), border=0)

        if profile.get("bio"):
            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(*GREY)
            pdf.multi_cell(0, 5, _wrap(profile["bio"], 100))

        pdf.ln(4)

    # ── Conversation ────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*BRAND)
    pdf.cell(0, 8, "Conversation", ln=True)
    pdf.set_draw_color(*LIGHT)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(2)

    messages = session.get("messages", [])
    for msg in messages:
        is_user = msg.get("isUser", False)
        content = msg.get("content", "").strip()
        if not content:
            continue

        speaker = "You" if is_user else "Careerra"
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_text_color(*BRAND if not is_user else (50, 50, 50))
        pdf.cell(0, 5, speaker, ln=True)

        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 30, 30)
        # Strip markdown asterisks/hashes for clean PDF rendering
        clean = content.replace("**", "").replace("##", "").replace("#", "")
        pdf.multi_cell(0, 5, _wrap(clean, 110))
        pdf.ln(2)

    # ── Footer ──────────────────────────────────────────────────────────────
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(*GREY)
    pdf.cell(0, 5,
             "⚠  AI-generated content. Salary data is approximate. Always verify with current sources. "
             "This plan supplements, not replaces, professional career counseling.",
             ln=True, align="C")

    return pdf.output()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/session/{session_id}/export/pdf")
async def export_session_pdf(session_id: str, user: Dict = Depends(get_current_user)):
    """
    Export a session as a formatted PDF career plan.
    Includes session messages + user profile summary.
    """
    session = firestore_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("userId") != user["uid"]:
        raise HTTPException(status_code=403, detail="Access denied")

    profile = firestore_service.get_user_profile(user["uid"]) or {}
    pdf_bytes = _build_pdf(session, profile)

    safe_title = session.get("title", "career-plan")[:40].replace(" ", "-").replace("/", "-")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_title}.pdf"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
