#!/usr/bin/env python3
"""
Reddit post enrichment pipeline.

Input CSV columns: reddit_post_id, title, raw_text, post_date, source_url, reddit_topic
Output JSONL: one line per post with all fields needed for Pinecone upsert:
    id, values (embedding), metadata {career_id, key_takeaway, sentiment,
    insight_type, quality_score, raw_text, title, post_date, source_url,
    reddit_topic}

Features:
- Resumable: writes a processed-ids checkpoint so re-runs skip done rows
- Rate-limited: sleeps between Gemini calls to respect free-tier quotas
- One Gemini call per post extracts all 5 classification fields at once
- Separate embedding call (different model, different endpoint)

Usage:
    cd backend
    python -m scripts.enrich_reddit_insights \\
        --input reddit_posts.csv \\
        --output reddit_enriched.jsonl \\
        --limit 500

Then run `pinecone_upsert.py` to push the JSONL to Pinecone.
"""

import argparse
import csv
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from google import genai

from app.config import settings
from app.services.firestore_service import init_firebase
from app.services import knowledge_base

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("enrich")

EMBED_MODEL = settings.pinecone_embedding_model  # default gemini-embedding-001
CHAT_MODEL = settings.gemini_model                # e.g. gemini-2.0-flash
CALL_DELAY = 0.35                                 # ~170 req/min, safe for free tier

INSIGHT_TYPES = [
    "day_in_life", "salary_info", "cert_review", "career_transition",
    "course_review", "regret_advice", "industry_outlook", "general",
]
SENTIMENTS = ["positive", "negative", "mixed", "neutral"]


# ---------------------------------------------------------------------------
# Gemini prompt — one shot extracts everything
# ---------------------------------------------------------------------------

def build_extraction_prompt(title: str, body: str, career_slugs: list[str]) -> str:
    return f"""You are labeling a Reddit post for a career-counseling knowledge base.

Post title: {title}
Post body (truncated): {body[:2500]}

Return ONLY valid JSON with these fields:
{{
  "career_id": "<one slug from the list below, or null if no clear match>",
  "key_takeaway": "<1-2 sentence distilled insight — what a reader would quote to someone else>",
  "sentiment": "positive | negative | mixed | neutral",
  "insight_type": "{' | '.join(INSIGHT_TYPES)}",
  "quality_score": <float 0-10 — rate the post's usefulness, specificity, and credibility; 0 = spam/vague, 10 = deeply specific first-hand experience with concrete detail>
}}

Rules:
- career_id MUST be one of: {", ".join(career_slugs)}
- If the post is generic career anxiety / exploration with no specific role, return null for career_id
- key_takeaway must be quotable on its own — no "the OP says" preamble
- Return ONLY the JSON object — no markdown fences, no prose
"""


# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

_gemini = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None


def classify_post(title: str, body: str, career_slugs: list[str]) -> Optional[Dict]:
    """Call Gemini to extract structured fields. Returns None on failure."""
    if not _gemini:
        raise RuntimeError("GEMINI_API_KEY not set")
    prompt = build_extraction_prompt(title or "", body or "", career_slugs)
    try:
        resp = _gemini.models.generate_content(model=CHAT_MODEL, contents=prompt)
        raw = (resp.text or "").strip()
        # Strip fences if the model added them
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip().rstrip("`").strip()
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        logger.warning("JSON parse failed: %s — raw=%r", exc, raw[:200])
        return None
    except Exception as exc:
        logger.warning("Gemini classify failed: %s", exc)
        return None

    # Normalise
    if data.get("career_id") in ("null", "", "none", "unknown"):
        data["career_id"] = None
    if data.get("sentiment") not in SENTIMENTS:
        data["sentiment"] = "mixed"
    if data.get("insight_type") not in INSIGHT_TYPES:
        data["insight_type"] = "general"
    try:
        data["quality_score"] = max(0.0, min(10.0, float(data.get("quality_score", 5.0))))
    except (TypeError, ValueError):
        data["quality_score"] = 5.0
    return data


def embed_post(text: str) -> Optional[list[float]]:
    """Get embedding for the post. Returns None on failure."""
    if not _gemini:
        return None
    try:
        resp = _gemini.models.embed_content(model=EMBED_MODEL, contents=text[:4000])
        return resp.embeddings[0].values
    except Exception as exc:
        logger.warning("Embedding failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def load_processed_ids(checkpoint: Path) -> set:
    if checkpoint.exists():
        return {line.strip() for line in checkpoint.read_text().splitlines() if line.strip()}
    return set()


def mark_processed(checkpoint: Path, post_id: str) -> None:
    with checkpoint.open("a") as f:
        f.write(post_id + "\n")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input",  required=True, help="CSV of Reddit posts")
    p.add_argument("--output", required=True, help="JSONL of enriched posts + embeddings")
    p.add_argument("--limit",  type=int, default=0, help="Max rows to process (0 = all)")
    p.add_argument("--skip-embeddings", action="store_true", help="Classify only, skip embedding")
    p.add_argument("--min-quality", type=float, default=0.0, help="Drop posts with quality < this (applied post-classification)")
    args = p.parse_args()

    if not _gemini:
        logger.error("GEMINI_API_KEY not configured in .env")
        sys.exit(1)

    init_firebase()
    careers = [c["career_id"] for c in knowledge_base.list_all_careers()]
    logger.info("Loaded %d career slugs", len(careers))

    checkpoint = Path(args.output).with_suffix(".processed.txt")
    done = load_processed_ids(checkpoint)
    logger.info("Resuming — %d posts already processed", len(done))

    with open(args.input, newline="", encoding="utf-8") as f_in, \
         open(args.output, "a", encoding="utf-8") as f_out:
        reader = csv.DictReader(f_in)
        processed = 0
        kept = 0

        for row in reader:
            post_id = row.get("reddit_post_id", "").strip()
            if not post_id or post_id in done:
                continue
            if args.limit and processed >= args.limit:
                break

            title = row.get("title", "").strip()
            body = row.get("raw_text", "").strip()
            if not body or len(body) < 80:
                # Skip very short posts — not useful
                mark_processed(checkpoint, post_id)
                processed += 1
                continue

            # 1. Classify
            cls = classify_post(title, body, careers)
            time.sleep(CALL_DELAY)
            if not cls:
                mark_processed(checkpoint, post_id)
                processed += 1
                continue

            # Drop low-quality posts early
            if cls["quality_score"] < args.min_quality:
                mark_processed(checkpoint, post_id)
                processed += 1
                continue

            # 2. Embed (unless skipped)
            embedding = None
            if not args.skip_embeddings:
                embed_text = f"{title}\n\n{body[:3000]}"
                embedding = embed_post(embed_text)
                time.sleep(CALL_DELAY)
                if embedding is None:
                    mark_processed(checkpoint, post_id)
                    processed += 1
                    continue

            # 3. Write JSONL row in Pinecone upsert shape
            record = {
                "id": post_id,
                "values": embedding,
                "metadata": {
                    "career_id": cls.get("career_id"),
                    "insight_type": cls["insight_type"],
                    "sentiment": cls["sentiment"],
                    "quality_score": cls["quality_score"],
                    "key_takeaway": cls["key_takeaway"],
                    "raw_text": body[:1500],  # Pinecone metadata size limit
                    "title": title[:200],
                    "post_date": row.get("post_date", ""),
                    "source_url": row.get("source_url", ""),
                    "reddit_topic": row.get("reddit_topic", ""),
                },
            }
            f_out.write(json.dumps(record) + "\n")
            f_out.flush()
            mark_processed(checkpoint, post_id)
            kept += 1
            processed += 1

            if processed % 25 == 0:
                logger.info("Progress: %d processed, %d kept, latest: %s", processed, kept, title[:60])

    logger.info("Done. Processed %d, kept %d (output: %s)", processed, kept, args.output)


if __name__ == "__main__":
    main()
