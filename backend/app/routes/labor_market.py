"""
Labor Market Data API — exposes BLS/SOC occupation data for careers.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import Dict, List

from app.middleware.auth import get_current_user
from app.services.labor_market import get_labor_market_data, get_labor_market_batch

logger = logging.getLogger(__name__)
router = APIRouter()


class BatchRequest(BaseModel):
    careers: List[str] = Field(..., min_length=1, max_length=10)


@router.get("/labor-market/{career}")
async def labor_market_single(career: str, user: Dict = Depends(get_current_user)):
    """
    Return labor market data for a single career:
    - SOC code mapping
    - Mean annual wage (from BLS OES, if available)
    - 10-year projected growth % (from BLS Employment Projections, if available)
    - Data source and freshness (7-day Firestore cache)
    """
    career = career.strip()
    if not career:
        raise HTTPException(status_code=422, detail="Career name is required")
    return get_labor_market_data(career)


@router.post("/labor-market/batch")
async def labor_market_batch(body: BatchRequest, user: Dict = Depends(get_current_user)):
    """
    Return labor market data for multiple careers at once (max 10).
    Results are keyed by career name.
    """
    careers = [c.strip() for c in body.careers if c.strip()]
    if not careers:
        raise HTTPException(status_code=422, detail="At least one career name required")
    return get_labor_market_batch(careers)
