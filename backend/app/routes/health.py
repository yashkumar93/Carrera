"""
Health check endpoint
"""
import logging
from fastapi import APIRouter
from app.services.firestore_service import check_firestore_health

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Check if the API is healthy and running, including Firestore connectivity."""
    firestore_ok = check_firestore_health()
    return {
        "status": "healthy" if firestore_ok else "degraded",
        "firestore": "connected" if firestore_ok else "disconnected",
    }
