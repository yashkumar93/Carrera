"""
Knowledge Base Service — Firestore-backed career data, courses, certifications,
project ideas, and community insights.

## Firestore Collection Mapping (from SQL schema)

careers/{career_id}
    display_name, sector, sub_sector, description, region,
    education_typical, salary_range_usd, salary_range_inr, growth_rate,
    skills_required[], aliases[], reddit_post_count, created_at

courses/{auto_id}
    external_id, platform, title, description, url, partner_name,
    duration_hours, difficulty, cost_usd, cost_inr, rating,
    domain, skills_taught[], career_ids[], updated_at

certifications/{auto_id}
    name, issuing_body, cost_usd, cost_inr, time_to_complete,
    validity_years, prerequisites, skills_validated[], value_tier,
    career_ids[], community_rating, updated_at

project_ideas/{auto_id}
    career_id, title, description, difficulty, skills_practiced[],
    estimated_hours, starter_url, created_at

community_insights/{auto_id}
    career_id, insight_type, title, raw_text, key_takeaway,
    sentiment, salary_mentioned, salary_context, certs_mentioned[],
    courses_mentioned[], reddit_topic, source_url, post_date,
    word_count, quality_score, created_at

career_course_map  → denormalised: courses carry career_ids[] array
career_cert_map    → denormalised: certifications carry career_ids[] array
feedback           → existing: users/{uid}/messages + wiki_updates
wiki tables        → existing: users/{uid}/wiki/{slug}, users/{uid}/wiki_updates
"""

import logging
import re
from typing import List, Dict, Optional, Any

from google.cloud.firestore_v1.base_query import FieldFilter

from app.services.firestore_service import get_firestore_client

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Careers
# ---------------------------------------------------------------------------

def get_career(career_id: str) -> Optional[Dict]:
    db = get_firestore_client()
    doc = db.collection("careers").document(career_id).get()
    return {"career_id": doc.id, **doc.to_dict()} if doc.exists else None


def search_careers(
    sector: Optional[str] = None,
    region: Optional[str] = None,
    limit: int = 20,
) -> List[Dict]:
    db = get_firestore_client()
    q = db.collection("careers")
    if sector:
        q = q.where(filter=FieldFilter("sector", "==", sector))
    if region:
        q = q.where(filter=FieldFilter("region", "in", [region, "GLOBAL"]))
    docs = list(q.limit(limit).stream())
    return [{"career_id": d.id, **d.to_dict()} for d in docs]


def list_all_careers() -> List[Dict]:
    db = get_firestore_client()
    docs = list(db.collection("careers").stream())
    return [{"career_id": d.id, **d.to_dict()} for d in docs]


def find_careers_by_keyword(query: str, limit: int = 5) -> List[Dict]:
    """
    Match careers by splitting the query into words and scoring hits
    against display_name, aliases, skills, and description.
    """
    # Extract meaningful words (skip stop-words shorter than 3 chars)
    words = [w for w in query.lower().split() if len(w) >= 3]
    if not words:
        return []

    all_careers = list_all_careers()
    scored: List[tuple] = []

    for c in all_careers:
        name = (c.get("display_name") or "").lower()
        aliases = " ".join(a.lower() for a in (c.get("aliases") or []))
        skills = " ".join(s.lower() for s in (c.get("skills_required") or []))
        desc = (c.get("description") or "").lower()
        blob = f"{name} {aliases} {skills} {desc}"

        hits = sum(1 for w in words if w in blob)
        # Boost exact name matches heavily
        name_hits = sum(1 for w in words if w in name)
        score = hits + name_hits * 3

        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:limit]]


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------

def get_courses_for_career(career_id: str, limit: int = 10) -> List[Dict]:
    db = get_firestore_client()
    docs = list(
        db.collection("courses")
        .where(filter=FieldFilter("career_ids", "array_contains", career_id))
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def search_courses(
    platform: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 20,
) -> List[Dict]:
    db = get_firestore_client()
    q = db.collection("courses")
    if platform:
        q = q.where(filter=FieldFilter("platform", "==", platform))
    if difficulty:
        q = q.where(filter=FieldFilter("difficulty", "==", difficulty))
    docs = list(q.limit(limit).stream())
    return [{"id": d.id, **d.to_dict()} for d in docs]


# ---------------------------------------------------------------------------
# Certifications
# ---------------------------------------------------------------------------

def get_certs_for_career(career_id: str, limit: int = 10) -> List[Dict]:
    db = get_firestore_client()
    docs = list(
        db.collection("certifications")
        .where(filter=FieldFilter("career_ids", "array_contains", career_id))
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


def get_cert_by_name(name: str) -> Optional[Dict]:
    """Check if a certification exists in our whitelist."""
    db = get_firestore_client()
    docs = list(
        db.collection("certifications")
        .where(filter=FieldFilter("name", "==", name))
        .limit(1)
        .stream()
    )
    return {"id": docs[0].id, **docs[0].to_dict()} if docs else None


def list_all_certifications() -> List[Dict]:
    db = get_firestore_client()
    docs = list(db.collection("certifications").stream())
    return [{"id": d.id, **d.to_dict()} for d in docs]


# In-memory whitelist cache — loaded once, refreshed on demand
_cert_name_whitelist: Optional[set] = None


def _normalize_cert_name(name: str) -> str:
    return (name or "").strip().lower()


def get_cert_whitelist(refresh: bool = False) -> set:
    """
    Return a set of normalized certification names from our curated whitelist.
    Loaded once per process, cached in-memory.
    """
    global _cert_name_whitelist
    if _cert_name_whitelist is None or refresh:
        try:
            certs = list_all_certifications()
            _cert_name_whitelist = {_normalize_cert_name(c.get("name", "")) for c in certs if c.get("name")}
            logger.info("Cert whitelist loaded: %d certifications", len(_cert_name_whitelist))
        except Exception as exc:
            logger.warning("Could not load cert whitelist: %s", exc)
            _cert_name_whitelist = set()
    return _cert_name_whitelist


def is_cert_whitelisted(name: str) -> bool:
    """
    Match a cert name against the whitelist using exact match first, then
    token-overlap (handles abbreviations like "AWS SAA" vs full name).
    Requires ≥70% of the candidate's meaningful tokens to appear in a whitelist entry.
    """
    if not name:
        return False
    needle = _normalize_cert_name(name)
    whitelist = get_cert_whitelist()
    if needle in whitelist:
        return True

    # Token-overlap fuzzy match
    STOP = {"the", "of", "and", "a", "an", "in", "on", "for", "with", "by", "-", "–", "&"}
    def tokens(s):
        return {t for t in re.split(r"[\s\-,]+", s) if t and t not in STOP and len(t) > 1}

    needle_tokens = tokens(needle)
    if not needle_tokens:
        return False

    for wl_name in whitelist:
        wl_tokens = tokens(wl_name)
        if not wl_tokens:
            continue
        overlap = needle_tokens & wl_tokens
        # Accept if ≥70% of the shorter side's tokens match
        smaller = min(len(needle_tokens), len(wl_tokens))
        if smaller > 0 and len(overlap) / smaller >= 0.7:
            return True
    return False


# ---------------------------------------------------------------------------
# Project Ideas
# ---------------------------------------------------------------------------

def get_projects_for_career(career_id: str, limit: int = 5) -> List[Dict]:
    db = get_firestore_client()
    docs = list(
        db.collection("project_ideas")
        .where(filter=FieldFilter("career_id", "==", career_id))
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


# ---------------------------------------------------------------------------
# Community Insights
# ---------------------------------------------------------------------------

def get_insights_for_career(
    career_id: str,
    min_quality: float = 5.0,
    limit: int = 5,
) -> List[Dict]:
    db = get_firestore_client()
    docs = list(
        db.collection("community_insights")
        .where(filter=FieldFilter("career_id", "==", career_id))
        .where(filter=FieldFilter("quality_score", ">=", min_quality))
        .limit(limit)
        .stream()
    )
    return [{"id": d.id, **d.to_dict()} for d in docs]


# ---------------------------------------------------------------------------
# Context builder — assemble KB context for the AI prompt
# ---------------------------------------------------------------------------

def build_kb_context(query: str, career_hint: Optional[str] = None) -> str:
    """
    Build a knowledge-base context block to inject into the system prompt.
    Semantic search first (via ChromaDB career_index), keyword fallback if that
    returns nothing. Then pulls related courses, certs, projects, insights.
    """
    sections: List[str] = []

    # Semantic match first
    matched_careers: List[Dict] = []
    try:
        from app.services import career_index
        matched_careers = career_index.search(query, n=3)
    except Exception as exc:
        logger.warning("Semantic career search failed, falling back to keyword: %s", exc)

    # Fall back to keyword scoring if semantic returned nothing
    if not matched_careers:
        matched_careers = find_careers_by_keyword(query, limit=3)

    if career_hint:
        hinted = get_career(career_hint)
        if hinted and hinted["career_id"] not in {c["career_id"] for c in matched_careers}:
            matched_careers.insert(0, hinted)

    if not matched_careers:
        return ""

    # Careers
    career_lines = []
    for c in matched_careers[:3]:
        line = (
            f"**{c['display_name']}** ({c.get('sector', '—')}) — "
            f"Salary: {c.get('salary_range_inr', '—')} INR / {c.get('salary_range_usd', '—')} USD, "
            f"Growth: {c.get('growth_rate', '—')}, "
            f"Skills: {', '.join((c.get('skills_required') or [])[:5])}"
        )
        career_lines.append(line)
    if career_lines:
        sections.append("### Relevant Careers\n" + "\n".join(career_lines))

    # For the top career match, pull related data
    top = matched_careers[0]
    cid = top["career_id"]

    courses = get_courses_for_career(cid, limit=3)
    if courses:
        course_lines = [
            f"- {c['title']} ({c.get('platform', '—')}, {c.get('difficulty', '—')}, "
            f"{'Free' if not c.get('cost_usd') else '$' + str(c['cost_usd'])})"
            for c in courses
        ]
        sections.append("### Relevant Courses\n" + "\n".join(course_lines))

    certs = get_certs_for_career(cid, limit=3)
    if certs:
        cert_lines = [
            f"- {c['name']} by {c.get('issuing_body', '—')} "
            f"({c.get('value_tier', '—')}, ~{c.get('time_to_complete', '—')})"
            for c in certs
        ]
        sections.append("### Relevant Certifications\n" + "\n".join(cert_lines))

    projects = get_projects_for_career(cid, limit=2)
    if projects:
        project_lines = [
            f"- {p['title']} ({p.get('difficulty', '—')}, ~{p.get('estimated_hours', '?')}h)"
            for p in projects
        ]
        sections.append("### Project Ideas\n" + "\n".join(project_lines))

    # Community insights — try Pinecone (Reddit data), fall back to Firestore
    insights: List[Dict] = []
    try:
        from app.services import pinecone_insights
        if pinecone_insights.is_available():
            insights = pinecone_insights.query_insights(query, career_id=cid, top_k=3)
    except Exception as exc:
        logger.warning("Pinecone insights query failed: %s", exc)

    if not insights:
        try:
            raw_insights = get_insights_for_career(cid, limit=2)
            insights = [
                {
                    "insight": r.get("key_takeaway") or r.get("raw_text", "")[:200],
                    "sentiment": r.get("sentiment", "mixed"),
                    "source": r.get("reddit_topic", "community"),
                }
                for r in raw_insights
            ]
        except Exception:
            pass  # No insights available — skip gracefully

    if insights:
        insight_lines = [
            f"- [{i.get('sentiment', 'mixed')}] \"{i.get('insight', '')[:200]}\" ({i.get('source', '')})"
            for i in insights
            if i.get('insight')
        ]
        if insight_lines:
            sections.append("### Community Perspectives (from Reddit)\n" + "\n".join(insight_lines))

    if not sections:
        return ""

    return "## Knowledge Base (real data — use in your response)\n\n" + "\n\n".join(sections)
