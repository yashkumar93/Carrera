"""
PDF Export — generate a downloadable career plan PDF for a session.
Uses fpdf2 (pure Python, no wkhtmltopdf dependency).
"""
import io
import logging
import textwrap
import unicodedata
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


def _pdf_text(text: str) -> str:
    """
    Convert text to something Helvetica can render.
    fpdf core fonts are Latin-1 only, so normalize punctuation and
    drop unsupported characters instead of crashing export.
    """
    if text is None:
        return ""
    cleaned = str(text)
    replacements = {
        "\u2014": "-",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2026": "...",
        "\u00a0": " ",
        "\u2022": "-",
        "\u26a0": "Warning",
        "\u00b7": "-",
    }
    for old, new in replacements.items():
        cleaned = cleaned.replace(old, new)
    cleaned = unicodedata.normalize("NFKD", cleaned)
    return cleaned.encode("latin-1", "ignore").decode("latin-1")


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
    pdf.cell(0, 10, _pdf_text("Careerra - Career Plan"), ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_xy(20, 19)
    pdf.cell(
        0,
        6,
        _pdf_text(
            f"Generated {datetime.utcnow().strftime('%B %d, %Y')} - AI advice supplements professional counseling"
        ),
        ln=True,
    )

    pdf.set_y(35)

    # ── Session title & stage ───────────────────────────────────────────────
    title = session.get("title", "Career Counseling Session")
    stage = session.get("stage", "discovery").title()

    pdf.set_text_color(30, 30, 30)
    pdf.set_font("Helvetica", "B", 15)
    pdf.cell(0, 8, _pdf_text(_wrap(title, 80)), ln=True)

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*GREY)
    pdf.cell(0, 5, _pdf_text(f"Stage: {stage}"), ln=True)
    pdf.ln(4)

    # ── Profile summary ─────────────────────────────────────────────────────
    if profile:
        pdf.set_fill_color(245, 240, 255)
        pdf.set_draw_color(*BRAND)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*BRAND)
        pdf.cell(0, 8, _pdf_text("Your Profile"), ln=True)

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
            start_x = pdf.get_x()
            start_y = pdf.get_y()
            pdf.set_font("Helvetica", "B", 9)
            pdf.cell(40, 6, _pdf_text(label + ":"), border=0)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_xy(start_x + 40, start_y)
            pdf.multi_cell(130, 6, _pdf_text(_wrap(str(value), 100)), border=0)
            pdf.set_x(start_x)

        if profile.get("bio"):
            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(*GREY)
            pdf.multi_cell(0, 5, _pdf_text(_wrap(profile["bio"], 100)))

        pdf.ln(4)

    # ── Conversation ────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(*BRAND)
    pdf.cell(0, 8, _pdf_text("Conversation"), ln=True)
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
        pdf.cell(0, 5, _pdf_text(speaker), ln=True)

        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(30, 30, 30)
        # Strip markdown asterisks/hashes for clean PDF rendering
        clean = content.replace("**", "").replace("##", "").replace("#", "")
        pdf.multi_cell(0, 5, _pdf_text(_wrap(clean, 110)))
        pdf.ln(2)

    # ── Footer ──────────────────────────────────────────────────────────────
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(*GREY)
    pdf.cell(
        0,
        5,
        _pdf_text(
            "Warning: AI-generated content. Salary data is approximate. Always verify with current sources. "
            "This plan supplements, not replaces, professional career counseling."
        ),
        ln=True,
        align="C",
    )

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


@router.get("/chat/export/pdf")
async def export_chat_history_pdf(user: Dict = Depends(get_current_user)):
    """
    Export the user's full persistent chat history as a PDF career plan.
    Replaces the per-session export now that we're on a single-chat model.
    """
    messages = firestore_service.get_chat_history(user["uid"], limit=500)
    if not messages:
        raise HTTPException(status_code=404, detail="No chat history to export")

    profile = firestore_service.get_user_profile(user["uid"]) or {}
    # Build a synthetic "session" dict so _build_pdf can render it unchanged
    synthetic_session = {
        "title": "Your Career Plan",
        "stage": profile.get("chat_stage", "discovery"),
        "messages": messages,
    }
    pdf_bytes = _build_pdf(synthetic_session, profile)

    filename = f"career-plan-{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
