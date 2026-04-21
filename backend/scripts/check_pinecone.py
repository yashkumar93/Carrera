#!/usr/bin/env python3
"""
Diagnostic: connect to Pinecone, print index stats and a sample record's
metadata. Use this to verify the index is reachable and to inspect the
metadata shape — critical for knowing whether our query filters will match.

    cd backend
    python -m scripts.check_pinecone
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings


def main():
    if not settings.pinecone_api_key:
        print("ERR: PINECONE_API_KEY not set in .env")
        sys.exit(1)

    print(f"Index name:   {settings.pinecone_index_name}")
    print(f"Namespace:    {settings.pinecone_namespace or '(default)'}")
    print(f"Query model:  {settings.pinecone_embedding_model}")
    print()

    from pinecone import Pinecone
    pc = Pinecone(api_key=settings.pinecone_api_key)

    # List all indexes for sanity
    indexes = [i.name for i in pc.list_indexes()]
    print(f"All indexes in your account: {indexes}")
    if settings.pinecone_index_name not in indexes:
        print(f"\nERR: '{settings.pinecone_index_name}' not found. "
              f"Set PINECONE_INDEX_NAME to one of the above in .env")
        sys.exit(1)

    # Describe
    desc = pc.describe_index(settings.pinecone_index_name)
    print(f"\nIndex details:")
    print(f"  dimension: {desc.dimension}")
    print(f"  metric:    {desc.metric}")
    print(f"  status:    {getattr(desc, 'status', 'n/a')}")
    print(f"  spec:      {desc.spec}")

    # Stats
    index = pc.Index(settings.pinecone_index_name)
    stats = index.describe_index_stats()
    total = stats.get("total_vector_count", "?")
    print(f"\nTotal vectors: {total}")
    ns = stats.get("namespaces", {}) or {}
    for ns_name, ns_info in ns.items():
        print(f"  namespace '{ns_name or '(default)'}': {ns_info.get('vector_count', 0)} vectors")

    # Sample one record to see the metadata shape
    if total and total != "?" and total > 0:
        print("\nSampling one vector (random top-1 query with zero vector)…")
        import random
        zero = [0.0] * desc.dimension
        zero[random.randint(0, desc.dimension - 1)] = 1.0
        kwargs = {"vector": zero, "top_k": 1, "include_metadata": True}
        if settings.pinecone_namespace:
            kwargs["namespace"] = settings.pinecone_namespace
        res = index.query(**kwargs)
        matches = res.get("matches", []) if isinstance(res, dict) else res.matches
        if matches:
            m = matches[0]
            meta = getattr(m, "metadata", None) or m.get("metadata", {})
            print("Sample metadata keys:", list(meta.keys()))
            print("Sample metadata:")
            print(json.dumps(meta, indent=2, default=str)[:1200])
        else:
            print("No matches returned — namespace mismatch or empty.")


if __name__ == "__main__":
    main()
