"""
Semantic career search — embeds the careers corpus into ChromaDB and does
cosine-similarity lookups against a user's query. Complements the simple
keyword match in knowledge_base.find_careers_by_keyword.

Usage:
    # One-off indexing (run after seeding or when the careers collection changes):
    python -m scripts.index_careers

    # From the backend:
    from app.services import career_index
    matches = career_index.search("I want to work with data", n=3)
"""

import logging
from typing import List, Dict, Optional

import chromadb
from chromadb.config import Settings

from app.services import firestore_service
from app.services import llm_service

logger = logging.getLogger(__name__)

COLLECTION_NAME = "careers_index"

_chroma_client: Optional[chromadb.PersistentClient] = None
_collection = None
def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=Settings(anonymized_telemetry=False),
        )
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def _embed(text: str) -> List[float]:
    return llm_service.embed_text(text)


def _career_to_searchable_text(career: Dict) -> str:
    """Concatenate the fields that best describe a career for semantic matching."""
    parts = [
        career.get("display_name", ""),
        career.get("description", ""),
        f"Sector: {career.get('sector', '')}",
        f"Sub-sector: {career.get('sub_sector', '')}",
        f"Skills: {', '.join(career.get('skills_required') or [])}",
        f"Aliases: {', '.join(career.get('aliases') or [])}",
        f"Education: {career.get('education_typical', '')}",
    ]
    return " | ".join(p for p in parts if p.strip())


def reindex_all() -> int:
    """
    Pull every career from Firestore, embed it, and upsert into ChromaDB.
    Returns the number of careers indexed. Safe to run repeatedly.
    """
    db = firestore_service.get_firestore_client()
    career_docs = list(db.collection("careers").stream())
    if not career_docs:
        logger.warning("No careers in Firestore — nothing to index")
        return 0

    coll = _get_collection()
    # Clear existing so stale entries don't linger
    try:
        existing = coll.get()
        if existing["ids"]:
            coll.delete(ids=existing["ids"])
    except Exception as exc:
        logger.warning("Could not clear old career index: %s", exc)

    ids: List[str] = []
    docs: List[str] = []
    embeddings: List[List[float]] = []
    metadatas: List[Dict] = []

    for d in career_docs:
        career = {"career_id": d.id, **d.to_dict()}
        text = _career_to_searchable_text(career)
        try:
            emb = _embed(text)
        except Exception as exc:
            logger.warning("Skipping career %s — embedding failed: %s", d.id, exc)
            continue
        ids.append(d.id)
        docs.append(text)
        embeddings.append(emb)
        metadatas.append({
            "career_id": d.id,
            "display_name": career.get("display_name", ""),
            "sector": career.get("sector", ""),
        })

    if ids:
        coll.add(ids=ids, documents=docs, embeddings=embeddings, metadatas=metadatas)
    logger.info("Career index: %d careers embedded", len(ids))
    return len(ids)


def search(query: str, n: int = 3, min_relevance: float = 0.2) -> List[Dict]:
    """
    Semantic search for careers matching the query.
    Returns full career records from Firestore (same shape as knowledge_base.get_career).
    Returns [] if the index is empty or the query fails.
    """
    try:
        coll = _get_collection()
        if coll.count() == 0:
            return []

        emb = _embed(query)
        result = coll.query(
            query_embeddings=[emb],
            n_results=min(n, coll.count()),
            include=["metadatas", "distances"],
        )

        matches: List[Dict] = []
        if result["ids"] and result["ids"][0]:
            for career_id, meta, dist in zip(
                result["ids"][0],
                result["metadatas"][0],
                result["distances"][0],
            ):
                relevance = 1 - dist  # cosine similarity
                if relevance < min_relevance:
                    continue
                # Pull the full career record from Firestore so we have all fields
                from app.services import knowledge_base
                full = knowledge_base.get_career(career_id)
                if full:
                    full["_relevance"] = round(relevance, 3)
                    matches.append(full)
        return matches

    except Exception as exc:
        logger.warning("Career index search failed for query %r: %s", query, exc)
        return []
