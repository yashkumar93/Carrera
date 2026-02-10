"""
Careerra Backend API
FastAPI server for AI career guidance chatbot
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routes import chat, session, health, auth
from app.config import settings

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Careerra API",
    description="AI-powered career guidance backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(session.router, prefix="/api", tags=["Session"])


@app.get("/")
async def root():
    return {"message": "Careerra API is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
