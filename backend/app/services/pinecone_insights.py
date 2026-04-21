"""
Pinecone-backed community insights retrieval.

The Reddit career-guidance posts live in a Pinecone index that you load
externally (the embeddings are produced there too). This service only
queries the index — it does NOT upsert.

## Expected Pinecone record shape

Each vector in the index should carry metadata with these keys:

    {
        "career_id":      "data-scientist",    // maps to our careers collection
        "insight_type":   "day_in_life" | "salary_info" | "cert_review" | ...,
        "title":          "Short title of the post",
        "key_takeaway":   "The 1-2 sentence distilled insight",
        "raw_text":       "Original post body (first ~500 chars is fine)",
        "sentiment":      "positive" | "negative" | "mixed" | "neutral",
        "quality_score":  7.5,                 // float, we filter >= 5.0
        "source_url":     "https://reddit.com/r/careerguidance/...",
        "reddit_topic":   "r/careerguidance",
        "post_date":      "2024-03-15",         // ISO string (Pinecone metadata can't store datetime natively)
    }

Any missing key falls back to sensible defaults when rendering. `career_id`
is the most important — it's what drives the per-career filter.

## Embedding compatibility

Pinecone similarity is only meaningful when the query is embedded with the
SAME model as the index. We default to Gemini `gemini-embedding-001`
(3072-dim) since that's what the rest of the app uses. If you loaded the
index with a different model, set `PINECONE_EMBEDDING_MODEL` in `.env`.
"""

import logging
from typing import List, Dict, Optional

from app.config import settings

logger = logging.getLogger(__name__)

_pc_client = None
_pc_index = None
_st_model = None  # sentence-transformers model, lazy-loaded


# ---------------------------------------------------------------------------
# Lazy clients
# ---------------------------------------------------------------------------

def _get_embedding_model():
    """
    Lazy-load the sentence-transformers model that matches what was used to
    embed the Pinecone index. First call downloads the model weights (~90 MB)
    and is slow; subsequent calls are instant.
    """
    global _st_model
    if _st_model is not None:
        return _st_model
    try:
        from sentence_transformers import SentenceTransformer
        model_name = settings.pinecone_embedding_model
        # Strip the "sentence-transformers/" prefix if present — both forms work
        if model_name.startswith("sentence-transformers/"):
            model_name = model_name.split("/", 1)[1]
        logger.info("Loading sentence-transformers model: %s", model_name)
        _st_model = SentenceTransformer(model_name)
        logger.info("Embedding model ready (dim=%d)", _st_model.get_sentence_embedding_dimension())
    except Exception as exc:
        logger.warning("Could not load embedding model: %s", exc)
        return None
    return _st_model


def _get_pinecone_index():
    """Lazy-init Pinecone client and index. Returns None if not configured."""
    global _pc_client, _pc_index
    if not settings.pinecone_api_key:
        return None
    if _pc_index is not None:
        return _pc_index
    try:
        from pinecone import Pinecone
        _pc_client = Pinecone(api_key=settings.pinecone_api_key)
        _pc_index = _pc_client.Index(settings.pinecone_index_name)
        logger.info("Pinecone index '%s' ready", settings.pinecone_index_name)
    except Exception as exc:
        logger.warning("Pinecone init failed: %s", exc)
        return None
    return _pc_index


def _embed(text: str) -> Optional[List[float]]:
    """Embed a query string with the same model used to build the index."""
    model = _get_embedding_model()
    if model is None:
        return None
    try:
        # sentence-transformers returns a numpy array; tolist() gives the List[float] Pinecone expects
        vec = model.encode(text[:2000], convert_to_numpy=True)
        return vec.tolist()
    except Exception as exc:
        logger.warning("Query embedding failed: %s", exc)
        return None


# ---------------------------------------------------------------------------
# Public query API
# ---------------------------------------------------------------------------

def is_available() -> bool:
    """Quick check — is Pinecone configured and reachable?"""
    return _get_pinecone_index() is not None


def query_insights(
    query: str,
    career_id: Optional[str] = None,
    min_quality: float = 5.0,
    top_k: int = 5,
) -> List[Dict]:
    """
    Semantic search over community insights.

    Args:
        query: user's current message (used to embed the query vector)
        career_id: optional — restrict to insights for one career
        min_quality: drop insights with quality_score below this
        top_k: how many results to return (before filtering)

    Returns a list of dicts in the shape expected by the CommunityInsight
    React component:
        { insight, sentiment, insightType, source, postDate, raw_text, career_id,
          source_url, quality_score, _relevance }
    """
    index = _get_pinecone_index()
    if index is None:
        return []

    embedding = _embed(query)
    if embedding is None:
        return []

    # Build metadata filter — Pinecone supports $and / $eq / $gte operators
    meta_filter: Dict = {"quality_score": {"$gte": float(min_quality)}}
    if career_id:
        meta_filter["career_id"] = {"$eq": career_id}

    try:
        kwargs = {
            "vector": embedding,
            "top_k": top_k,
            "include_metadata": True,
            "filter": meta_filter,
        }
        if settings.pinecone_namespace:
            kwargs["namespace"] = settings.pinecone_namespace

        result = index.query(**kwargs)
    except Exception as exc:
        logger.warning("Pinecone query failed: %s", exc)
        return []

    matches = getattr(result, "matches", None) or result.get("matches", []) if isinstance(result, dict) else []

    insights: List[Dict] = []
    for m in matches:
        # Pinecone client returns either dicts or pydantic-like objects depending on version
        score = getattr(m, "score", None) if not isinstance(m, dict) else m.get("score")
        meta = getattr(m, "metadata", None) if not isinstance(m, dict) else m.get("metadata", {})
        meta = meta or {}

        insights.append({
            "insight": meta.get("key_takeaway") or meta.get("raw_text", "")[:300],
            "sentiment": meta.get("sentiment", "mixed"),
            "insightType": meta.get("insight_type", "Community perspective"),
            "source": meta.get("reddit_topic", "r/careerguidance"),
            "postDate": meta.get("post_date"),
            "raw_text": meta.get("raw_text"),
            "career_id": meta.get("career_id"),
            "source_url": meta.get("source_url"),
            "quality_score": meta.get("quality_score"),
            "_relevance": round(float(score), 3) if score is not None else None,
        })
    return insights
