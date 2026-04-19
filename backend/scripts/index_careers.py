#!/usr/bin/env python3
"""
One-off script to embed the careers corpus into ChromaDB.
Run after seeding careers or whenever the careers collection changes.

    cd backend
    .venv_new/bin/python -m scripts.index_careers
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.firestore_service import init_firebase
from app.services.career_index import reindex_all

init_firebase()
count = reindex_all()
print(f"✓ Indexed {count} careers into ChromaDB")
