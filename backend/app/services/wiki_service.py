"""
Personal Wiki Memory — a compiled, distilled knowledge base per user.

Instead of re-deriving knowledge from raw chat logs every session, the AI
incrementally maintains 6 structured markdown pages that compress the
user's entire career-counseling journey into ~800 words of current,
high-signal context.

## Architecture (3 layers)
1. Raw sources : users/{uid}/messages              — immutable source of truth
2. The wiki   : users/{uid}/wiki/{page_slug}       — compiled knowledge
3. The schema : WIKI_UPDATE_PROMPT (this file)     — instructions for the maintainer

## Pages (exactly 6)
- profile.md           — who they are (education, skills, constraints)
- explorations.md      — career paths explored with status (interested|considering|rejected|chosen)
- roadmap.md           — current learning plan with milestone status
- decisions.md         — major decisions + WHY (most valuable page)
- session_log.md       — chronological one-line session summaries (append-only)
- courses_tracking.md  — courses/certs/projects with progress status

## Update rules (conservative)
Each page is only revised when the exchange reveals information relevant to
that page. Most exchanges update 1-2 pages, not all 6. session_log.md is the
only append-only page; everything else is revised in-place.

## Audit trail
Every wiki revision is logged to users/{uid}/wiki_updates with a short
summary and a version bump on each page that changed.
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional

from google import genai

from app.config import settings
from app.services import firestore_service

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Wiki page catalogue
# ---------------------------------------------------------------------------

PAGE_SLUGS: List[str] = [
    "profile",
    "explorations",
    "roadmap",
    "decisions",
    "session_log",
    "courses_tracking",
]

PAGE_DESCRIPTIONS: Dict[str, str] = {
    "profile":          "Who the user is — education, current role, location, skills, interests, constraints",
    "explorations":     "Career paths discussed with status (interested | considering | rejected | chosen), fit score, key attractions or rejection reasons",
    "roadmap":          "Current learning plan — milestones with status (not_started | in_progress | completed | abandoned)",
    "decisions":        "Major decisions with clear reasoning — the WHY behind choices",
    "session_log":      "Append-only chronological record — one line per meaningful exchange",
    "courses_tracking": "Courses, certifications, and projects with progress status",
}

INITIAL_PAGES: Dict[str, str] = {
    "profile":          "# Profile\n\n_Not yet established — will be filled as the user shares their background._\n",
    "explorations":     "# Career Explorations\n\n_No careers discussed yet._\n",
    "roadmap":          "# Learning Roadmap\n\n_No roadmap yet._\n",
    "decisions":        "# Key Decisions\n\n_No major decisions recorded yet._\n",
    "session_log":      "# Session Log\n\n",
    "courses_tracking": "# Courses & Projects\n\n_Nothing being tracked yet._\n",
}

# ---------------------------------------------------------------------------
# Gemini prompt — the schema layer
# ---------------------------------------------------------------------------

WIKI_UPDATE_PROMPT = """You are the wiki maintainer for a career-counseling app.
Your job: read the latest exchange and update ONLY the wiki pages that genuinely need to change.

## CURRENT WIKI
{wiki_content}

## LATEST EXCHANGE
User: {user_message}
Assistant: {ai_response}

## UPDATE RULES (strict — do not over-update)
- **profile**: Update ONLY if new personal facts were revealed (new skill, job change, education update, constraint, preference).
- **explorations**: Update if a new career was discussed, an existing one's status changed (interested → considering → rejected/chosen), or the fit assessment was revised.
- **roadmap**: Update if learning plan items were added, removed, or had status changes.
- **decisions**: Update ONLY if a SIGNIFICANT decision was made with clear reasoning ("I chose X because Y"). Skip small preferences.
- **session_log**: ALWAYS append one new entry of the form `### {date}\\n- <one-line summary of this exchange>`. Never rewrite prior entries.
- **courses_tracking**: Update if a course / cert / project was mentioned as started, progressed, completed, or abandoned.

## IMPORTANT
- Most exchanges should update **1-2 pages**, not all 6. Be conservative.
- Rewrite the ENTIRE page content when updating (we replace, not diff).
- Keep pages compact — well-structured markdown, no verbose repetition.
- Do NOT update pages unless the exchange genuinely warrants it.

## OUTPUT
Return ONLY valid JSON — no markdown fences, no prose:
{{
  "pages": {{
    "page_slug": "full updated markdown content",
    ...
  }},
  "summary": "one-line description of what changed"
}}

Include only pages that changed. Return `"pages": {{}}` if nothing warranted an update.
"""


# ---------------------------------------------------------------------------
# Firestore helpers
# ---------------------------------------------------------------------------

def _wiki_col(user_id: str):
    db = firestore_service.get_firestore_client()
    return db.collection("users").document(user_id).collection("wiki")


def _update_log_col(user_id: str):
    db = firestore_service.get_firestore_client()
    return db.collection("users").document(user_id).collection("wiki_updates")


def get_page(user_id: str, slug: str) -> Dict:
    """Return {content, version, updated_at} for a page, creating a default if missing."""
    doc = _wiki_col(user_id).document(slug).get()
    if doc.exists:
        data = doc.to_dict()
        return {
            "slug": slug,
            "content": data.get("content", INITIAL_PAGES.get(slug, "")),
            "version": data.get("version", 1),
            "updated_at": data.get("updated_at"),
        }
    return {
        "slug": slug,
        "content": INITIAL_PAGES.get(slug, ""),
        "version": 0,
        "updated_at": None,
    }


def set_page(user_id: str, slug: str, content: str) -> int:
    """Upsert a page with version increment. Returns the new version number."""
    from firebase_admin import firestore as fb
    doc_ref = _wiki_col(user_id).document(slug)
    current = doc_ref.get()
    new_version = (current.to_dict().get("version", 0) + 1) if current.exists else 1
    doc_ref.set({
        "slug": slug,
        "content": content,
        "version": new_version,
        "word_count": len(content.split()),
        "updated_at": fb.SERVER_TIMESTAMP,
    }, merge=True)
    return new_version


def get_full_wiki(user_id: str) -> Dict[str, Dict]:
    """Return all pages as {slug: {content, version, updated_at}}."""
    docs = _wiki_col(user_id).stream()
    wiki = {
        doc.id: {
            "slug": doc.id,
            **doc.to_dict(),
        }
        for doc in docs
    }
    # Fill missing pages with defaults
    for slug in PAGE_SLUGS:
        if slug not in wiki:
            wiki[slug] = {
                "slug": slug,
                "content": INITIAL_PAGES[slug],
                "version": 0,
                "updated_at": None,
            }
    return wiki


def delete_wiki(user_id: str) -> None:
    """Delete all wiki pages and the update log for a user."""
    for doc in _wiki_col(user_id).stream():
        doc.reference.delete()
    for doc in _update_log_col(user_id).stream():
        doc.reference.delete()
    logger.info("Wiki + update log deleted for user %s", user_id)


def log_update(user_id: str, pages_updated: List[str], summary: str) -> None:
    """Append an entry to the wiki update audit trail."""
    from firebase_admin import firestore as fb
    _update_log_col(user_id).document().set({
        "pages_updated": pages_updated,
        "summary": summary,
        "created_at": fb.SERVER_TIMESTAMP,
    })


def get_update_log(user_id: str, limit: int = 20) -> List[Dict]:
    """Return the most recent wiki updates for the user."""
    from firebase_admin import firestore as fb
    docs = (
        _update_log_col(user_id)
        .order_by("created_at", direction=fb.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [{"id": doc.id, **doc.to_dict()} for doc in docs]


# ---------------------------------------------------------------------------
# Context builder — injected into the AI system prompt on every chat request
# ---------------------------------------------------------------------------

def build_wiki_context(user_id: str) -> str:
    """
    Compile the full wiki into a compact "What I know about you" block.
    Only includes pages that have real content (skips defaults).
    """
    wiki = get_full_wiki(user_id)
    sections: List[str] = []
    for slug in PAGE_SLUGS:
        content = wiki[slug]["content"].strip()
        if not content or wiki[slug]["version"] == 0:
            continue
        # Skip empty defaults
        if "No " in content[:80] and "yet" in content[:80]:
            continue
        sections.append(f"### /{slug}\n{content}")
    if not sections:
        return ""
    return "## What I Know About You (from past conversations)\n\n" + "\n\n".join(sections)


# ---------------------------------------------------------------------------
# Background wiki updater
# ---------------------------------------------------------------------------

async def update_wiki(user_id: str, user_message: str, ai_response: str) -> None:
    """
    Called as a FastAPI BackgroundTask after every AI response.
    Never blocks the response — failures are logged and swallowed.
    """
    if not settings.gemini_api_key:
        return

    try:
        wiki = get_full_wiki(user_id)
        wiki_content = "\n\n---\n\n".join(
            f"**/{slug}** (v{wiki[slug]['version']})\n{wiki[slug]['content']}"
            for slug in PAGE_SLUGS
        )

        prompt = WIKI_UPDATE_PROMPT.format(
            wiki_content=wiki_content,
            user_message=user_message[:1200],
            ai_response=ai_response[:2400],
            date=datetime.utcnow().strftime("%Y-%m-%d"),
        )

        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip().rstrip("`").strip()

        result = json.loads(raw)
        pages: Dict[str, str] = result.get("pages", {})
        summary: str = result.get("summary", "") or "Minor update"

        updated_slugs: List[str] = []
        for slug, content in pages.items():
            if slug in PAGE_SLUGS and content.strip():
                set_page(user_id, slug, content.strip())
                updated_slugs.append(slug)

        if updated_slugs:
            log_update(user_id, updated_slugs, summary)
            logger.info(
                "Wiki updated for user %s — pages=%s, summary=%s",
                user_id, updated_slugs, summary,
            )

    except json.JSONDecodeError as exc:
        logger.warning("Wiki update: invalid JSON from Gemini for user %s — %s", user_id, exc)
    except Exception as exc:
        logger.warning("Wiki update failed for user %s: %s", user_id, exc)
