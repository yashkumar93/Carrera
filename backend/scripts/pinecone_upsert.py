#!/usr/bin/env python3
"""
Upload enriched Reddit posts to Pinecone.

Expects JSONL output from enrich_reddit_insights.py where each line is:
    {"id": "abc123", "values": [float, ...], "metadata": {...}}

Usage:
    cd backend
    python -m scripts.pinecone_upsert --input reddit_enriched.jsonl

Requires PINECONE_API_KEY and PINECONE_INDEX_NAME in .env. The index must
already exist and have dimension = 3072 (Gemini gemini-embedding-001), or
match whatever embedding model you used in the enrichment step.
"""

import argparse
import json
import logging
import os
import sys
from typing import List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("upsert")

BATCH_SIZE = 100


def _sanitize_metadata(meta: dict) -> dict:
    """Pinecone metadata values must be str, number, bool, or list[str]. Filter None out."""
    out = {}
    for k, v in meta.items():
        if v is None:
            continue
        if isinstance(v, (str, int, float, bool)):
            out[k] = v
        elif isinstance(v, list) and all(isinstance(x, str) for x in v):
            out[k] = v
        else:
            out[k] = str(v)
    return out


def upsert_batch(index, batch: List[dict], namespace: str = ""):
    vectors = [
        {
            "id": r["id"],
            "values": r["values"],
            "metadata": _sanitize_metadata(r.get("metadata", {})),
        }
        for r in batch
        if r.get("values") and r.get("id")
    ]
    if not vectors:
        return 0
    kwargs = {"vectors": vectors}
    if namespace:
        kwargs["namespace"] = namespace
    index.upsert(**kwargs)
    return len(vectors)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="JSONL from enrich_reddit_insights.py")
    p.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    args = p.parse_args()

    if not settings.pinecone_api_key:
        logger.error("PINECONE_API_KEY not set in .env")
        sys.exit(1)

    from pinecone import Pinecone
    pc = Pinecone(api_key=settings.pinecone_api_key)
    index = pc.Index(settings.pinecone_index_name)

    logger.info(
        "Upserting to index='%s' namespace='%s'",
        settings.pinecone_index_name, settings.pinecone_namespace or "(default)",
    )

    batch: List[dict] = []
    total = 0
    with open(args.input, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError as e:
                logger.warning("Line %d skipped — bad JSON: %s", line_no, e)
                continue
            batch.append(rec)
            if len(batch) >= args.batch_size:
                n = upsert_batch(index, batch, settings.pinecone_namespace)
                total += n
                logger.info("Upserted %d (total: %d)", n, total)
                batch = []

    # Final partial batch
    if batch:
        n = upsert_batch(index, batch, settings.pinecone_namespace)
        total += n
        logger.info("Upserted final batch of %d (total: %d)", n, total)

    logger.info("Done — %d vectors upserted to %s", total, settings.pinecone_index_name)


if __name__ == "__main__":
    main()
