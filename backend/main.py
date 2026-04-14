"""
Careerra Backend API
FastAPI server for AI career guidance chatbot
"""
import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routes import chat, session, health, auth, admin, resume, assessment, mentorship, community, employers, public_api, compare, roadmap, export, labor_market
from app.config import settings
from app.services.firestore_service import cleanup_firebase
from app.services import scheduler as background_scheduler

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])

# Create FastAPI app
app = FastAPI(
    title="Careerra API",
    description="AI-powered career guidance backend",
    version="2.0.0",
)

# Attach limiter to app state (required by slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request/Response logging middleware
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every request with method, path, status, and response time."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000

    logger.info(
        "%s %s → %d (%.1fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(session.router, prefix="/api", tags=["Session"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])
app.include_router(resume.router, prefix="/api", tags=["Resume"])
app.include_router(assessment.router, prefix="/api", tags=["Assessment"])
app.include_router(mentorship.router, prefix="/api", tags=["Mentorship"])
app.include_router(community.router, prefix="/api", tags=["Community"])
app.include_router(employers.router, prefix="/api", tags=["Employers"])
app.include_router(public_api.router, prefix="/api", tags=["Public API"])
app.include_router(compare.router, prefix="/api", tags=["Compare"])
app.include_router(roadmap.router, prefix="/api", tags=["Roadmap"])
app.include_router(export.router, prefix="/api", tags=["Export"])
app.include_router(labor_market.router, prefix="/api", tags=["Labor Market"])


@app.get("/")
async def root():
    return {"message": "Careerra API is running", "version": "2.0.0", "docs": "/docs"}


# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    """Start background scheduler on app start."""
    background_scheduler.start()
    logger.info("Background scheduler started.")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up Firebase resources on shutdown."""
    logger.info("Shutting down — cleaning up resources...")
    background_scheduler.stop()
    cleanup_firebase()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
