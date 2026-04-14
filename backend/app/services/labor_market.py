"""
Labor Market Data Service — fetches occupation data from O*NET and
BLS public APIs (no key required for basic BLS v1 queries).
Results are cached in Firestore to minimise external calls.
"""
import json
import logging
import re
import urllib.request
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.services.firestore_service import get_firestore_client

logger = logging.getLogger(__name__)

# BLS public API (no key, rate-limited to 25 req/day without registration)
BLS_API_URL = "https://api.bls.gov/publicAPI/v1/timeseries/data/"

# ONET Web Services (free, open access endpoint)
ONET_BASE = "https://services.onetcenter.org/ws"

# Cache TTL — 7 days (labor market data doesn't change rapidly)
CACHE_TTL_DAYS = 7

# Curated SOC code mapping for common career paths
# Source: BLS Standard Occupational Classification
SOC_MAP: Dict[str, str] = {
    "software engineer": "15-1252",
    "software developer": "15-1252",
    "data scientist": "15-2051",
    "data analyst": "15-2041",
    "machine learning engineer": "15-2051",
    "ai engineer": "15-2051",
    "ux designer": "27-1021",
    "ui designer": "27-1021",
    "product manager": "11-2021",
    "project manager": "11-3021",
    "cybersecurity analyst": "15-1212",
    "information security analyst": "15-1212",
    "devops engineer": "15-1244",
    "cloud engineer": "15-1231",
    "network engineer": "15-1241",
    "database administrator": "15-1242",
    "web developer": "15-1254",
    "full stack developer": "15-1254",
    "frontend developer": "15-1254",
    "backend developer": "15-1252",
    "mobile developer": "15-1252",
    "business analyst": "13-1111",
    "financial analyst": "13-2051",
    "accountant": "13-2011",
    "marketing manager": "11-2021",
    "digital marketer": "13-1161",
    "content creator": "27-3043",
    "graphic designer": "27-1024",
    "mechanical engineer": "17-2141",
    "electrical engineer": "17-2071",
    "civil engineer": "17-2051",
    "biomedical engineer": "17-2031",
    "nurse": "29-1141",
    "doctor": "29-1216",
    "physician": "29-1216",
    "pharmacist": "29-1051",
    "lawyer": "23-1011",
    "teacher": "25-2031",
    "data engineer": "15-1243",
    "research scientist": "19-1099",
    "statistician": "15-2041",
    "economist": "19-3011",
    "human resources": "13-1071",
    "supply chain manager": "11-3071",
    "operations manager": "11-1021",
}


def _normalise(career: str) -> str:
    return career.lower().strip()


def _lookup_soc(career: str) -> Optional[str]:
    """Return the SOC code for a career name (fuzzy match)."""
    norm = _normalise(career)
    # Exact match
    if norm in SOC_MAP:
        return SOC_MAP[norm]
    # Substring match
    for key, soc in SOC_MAP.items():
        if key in norm or norm in key:
            return soc
    return None


def _cache_key(career: str) -> str:
    return "lm_" + re.sub(r"[^a-z0-9]", "_", _normalise(career))


def _read_cache(career: str) -> Optional[Dict]:
    """Return cached labor market data if fresh, else None."""
    try:
        db = get_firestore_client()
        doc = db.collection("lm_cache").document(_cache_key(career)).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        cached_at = data.get("cached_at")
        if cached_at and (datetime.utcnow() - cached_at).days < CACHE_TTL_DAYS:
            return data.get("payload")
    except Exception as exc:
        logger.warning("Cache read failed: %s", exc)
    return None


def _write_cache(career: str, payload: Dict) -> None:
    try:
        db = get_firestore_client()
        db.collection("lm_cache").document(_cache_key(career)).set({
            "payload": payload,
            "cached_at": datetime.utcnow(),
            "career": career,
        })
    except Exception as exc:
        logger.warning("Cache write failed: %s", exc)


def _fetch_bls_employment(soc: str) -> Optional[Dict]:
    """
    Fetch Occupational Employment & Wage Statistics from BLS public API.
    Series format: OEUM0000000{soc_nodash}3  (national, all industries, mean annual wage)
    """
    try:
        soc_clean = soc.replace("-", "")
        series_id = f"OEUM0000000{soc_clean}3"  # Mean annual wage
        url = f"{BLS_API_URL}{series_id}?latest=true"
        req = urllib.request.Request(url, headers={"User-Agent": "Careerra/2.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode())

        if body.get("status") != "REQUEST_SUCCEEDED":
            return None

        series_data = body.get("Results", {}).get("series", [{}])[0]
        data_points = series_data.get("data", [])
        if not data_points:
            return None

        latest = data_points[0]
        return {
            "mean_annual_wage": int(latest.get("value", "0").replace(",", "")),
            "year": latest.get("year"),
            "period": latest.get("period"),
        }
    except Exception as exc:
        logger.debug("BLS fetch failed for SOC %s: %s", soc, exc)
        return None


def _fetch_bls_projections(soc: str) -> Optional[Dict]:
    """
    Fetch Employment Projections from BLS (EP series).
    Returns percent change over 10-year projection period.
    """
    try:
        soc_clean = soc.replace("-", "")
        # EP (Employment Projections) series for this occupation
        series_id = f"EP{soc_clean}01"
        url = f"{BLS_API_URL}{series_id}?latest=true"
        req = urllib.request.Request(url, headers={"User-Agent": "Careerra/2.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = json.loads(resp.read().decode())

        if body.get("status") != "REQUEST_SUCCEEDED":
            return None

        series_data = body.get("Results", {}).get("series", [{}])[0]
        data_points = series_data.get("data", [])
        if not data_points:
            return None

        return {"projected_growth_pct": float(data_points[0].get("value", 0))}
    except Exception as exc:
        logger.debug("BLS projections failed for SOC %s: %s", soc, exc)
        return None


def get_labor_market_data(career: str) -> Dict:
    """
    Return labor market data for a career. Checks cache first.
    Falls back gracefully if BLS API is unavailable.
    """
    # Check cache
    cached = _read_cache(career)
    if cached:
        logger.info("Labor market cache hit for '%s'", career)
        return cached

    result: Dict = {
        "career": career,
        "source": "estimate",
        "data_date": datetime.utcnow().strftime("%Y-%m"),
    }

    soc = _lookup_soc(career)
    if soc:
        result["soc_code"] = soc
        wage_data = _fetch_bls_employment(soc)
        if wage_data:
            result["mean_annual_wage_usd"] = wage_data["mean_annual_wage"]
            result["wage_year"] = wage_data["year"]
            result["source"] = "BLS OES"

        proj_data = _fetch_bls_projections(soc)
        if proj_data:
            result["projected_growth_10yr_pct"] = proj_data["projected_growth_pct"]
            result["source"] = "BLS OES + EP"
    else:
        result["soc_code"] = None

    result["note"] = (
        "Data from US Bureau of Labor Statistics (BLS). "
        "Figures are national averages and may not reflect local market conditions."
        if result["source"].startswith("BLS")
        else "SOC code not mapped for this career — figures are AI estimates."
    )

    _write_cache(career, result)
    logger.info("Labor market data for '%s': source=%s", career, result["source"])
    return result


def get_labor_market_batch(careers: List[str]) -> Dict[str, Dict]:
    """Fetch labor market data for multiple careers."""
    return {career: get_labor_market_data(career) for career in careers}
