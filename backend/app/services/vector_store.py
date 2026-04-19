"""
Vector memory store using ChromaDB + Google text-embedding-004.

Every chat message (user + AI) is embedded and stored so the AI can
semantically recall relevant context from the full conversation history,
even when that history is too long to fit in the context window.

Note: The primary memory mechanism is wiki_service (structured wiki pages).
This module provides lower-level semantic search as a complement.
"""
import logging
import time
import uuid
from typing import List, Dict, Optional

import chromadb
from chromadb.config import Settings
from google import genai

from app.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "chat_messages"

_chroma_client: Optional[chromadb.PersistentClient] = None
_collection = None
_genai_client = None


def _get_genai():
    global _genai_client
    if _genai_client is None and settings.gemini_api_key:
        _genai_client = genai.Client(api_key=settings.gemini_api_key)
    return _genai_client


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
        logger.info("ChromaDB collection '%s' ready (%d docs)", COLLECTION_NAME, _collection.count())
    return _collection


def _embed(text: str) -> List[float]:
    """Embed text using Google text-embedding-004."""
    client = _get_genai()
    if client is None:
        raise RuntimeError("Gemini API key not configured")
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text[:4000],
    )
    return result.embeddings[0].values


def add_message(user_id: str, content: str, is_user: bool, message_id: str = None) -> str:
    """Embed and persist one message. Returns the message_id used."""
    msg_id = message_id or str(uuid.uuid4())
    try:
        embedding = _embed(content)
        coll = _get_collection()
        coll.add(
            ids=[msg_id],
            embeddings=[embedding],
            documents=[content],
            metadatas=[{
                "user_id": user_id,
                "is_user": str(is_user),
                "ts": str(time.time()),
            }],
        )
    except Exception as exc:
        logger.warning("Vector store: failed to add message %s — %s", msg_id, exc)
    return msg_id


def get_relevant_context(user_id: str, query: str, n_results: int = 6) -> List[Dict]:
    """Return semantically relevant past messages, sorted oldest-first."""
    try:
        coll = _get_collection()
        existing = coll.get(where={"user_id": user_id}, limit=1)
        if not existing["ids"]:
            return []

        all_user_docs = coll.get(where={"user_id": user_id})
        total = len(all_user_docs["ids"])

        embedding = _embed(query)
        results = coll.query(
            query_embeddings=[embedding],
            n_results=min(n_results, total),
            where={"user_id": user_id},
            include=["documents", "metadatas", "distances"],
        )

        messages: List[Dict] = []
        if results["documents"] and results["documents"][0]:
            for doc, meta, dist in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0],
            ):
                messages.append({
                    "content": doc,
                    "is_user": meta.get("is_user") == "True",
                    "ts": float(meta.get("ts", 0)),
                })

        messages.sort(key=lambda m: m["ts"])
        return messages

    except Exception as exc:
        logger.warning("Vector store query failed for user %s: %s", user_id, exc)
        return []


def delete_user_messages(user_id: str) -> None:
    """Delete all stored embeddings for a user."""
    try:
        _get_collection().delete(where={"user_id": user_id})
        logger.info("Vector store: cleared messages for user %s", user_id)
    except Exception as exc:
        logger.warning("Vector store: delete failed for user %s — %s", user_id, exc)
