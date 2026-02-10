"""
Chat endpoint with Gemini AI integration (google.genai SDK)
"""
import asyncio
import json
import logging
import time
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from google import genai
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.middleware.auth import get_current_user
from app.services import firestore_service

limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Gemini client
gemini_client = None
if settings.gemini_api_key:
    gemini_client = genai.Client(api_key=settings.gemini_api_key)

# Valid conversation stages
VALID_STAGES = {"discovery", "assessment", "exploration", "roadmap"}

# System prompt for career guidance
CAREER_ADVISOR_PROMPT = """You are Careerra, an expert AI career advisor. Your role is to help users discover their ideal career path, assess their skills, and create actionable roadmaps for professional growth.

Your conversation style:
- Be warm, encouraging, and professional
- Ask thoughtful follow-up questions to understand the user better
- Provide specific, actionable advice based on their situation
- Reference real courses, certifications, and skills that are in-demand
- Be concise but thorough in your responses

Current conversation stage: {stage}

Stage guidelines:
- DISCOVERY: Ask about their background, interests, what excites them, and current situation
- ASSESSMENT: Dive deeper into their skills, experience level, and identify gaps
- EXPLORATION: Suggest 2-3 career paths that match their profile, explain why each fits
- ROADMAP: Create a specific action plan with courses, projects, and timeline

STAGE PROGRESSION:
Based on the conversation so far, decide if the user is ready to move to the next stage.
If so, include the tag [STAGE: <next_stage>] at the very end of your response (e.g., [STAGE: assessment]).
Only include this tag when a transition makes sense. Valid stages: discovery, assessment, exploration, roadmap.

Always end your response with 1-2 relevant follow-up questions or suggestions to keep the conversation moving forward.

Previous context from this conversation:
{context}
"""


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The user's message (1–5000 characters)",
    )
    session_id: Optional[str] = None
    stage: Optional[str] = Field(
        None,
        description="Conversation stage: discovery, assessment, exploration, or roadmap",
    )


class ChatResponse(BaseModel):
    response: str
    session_id: str
    stage: str
    suggestions: List[str]


def generate_suggestions(stage: str, response: str) -> List[str]:
    """Generate contextual suggestions based on stage."""
    suggestions_map = {
        "discovery": [
            "Tell me about your educational background",
            "What skills do you enjoy using most?",
            "What's your dream job environment?",
        ],
        "assessment": [
            "What technical skills do you have?",
            "Describe your biggest professional achievement",
            "What areas do you want to improve?",
        ],
        "exploration": [
            "Tell me more about this career path",
            "What would a typical day look like?",
            "What's the salary range for this role?",
        ],
        "roadmap": [
            "Create a 90-day action plan",
            "What courses should I start with?",
            "How do I build a portfolio?",
        ],
    }
    return suggestions_map.get(stage, suggestions_map["discovery"])[:3]


def parse_stage_from_response(response_text: str, current_stage: str) -> tuple:
    """Parse AI-driven stage tag from response and return (cleaned_text, stage)."""
    import re
    pattern = r'\[STAGE:\s*(discovery|assessment|exploration|roadmap)\s*\]'
    match = re.search(pattern, response_text, re.IGNORECASE)
    if match:
        new_stage = match.group(1).lower()
        cleaned = re.sub(pattern, '', response_text, flags=re.IGNORECASE).rstrip()
        return cleaned, new_stage
    return response_text, current_stage


def build_prompt_contents(system_prompt: str, message: str, messages: list) -> str:
    """Build the full prompt including system prompt, context, and user message."""
    return system_prompt + "\n\nUser: " + message


async def call_gemini_with_retry(contents: str, max_retries: int = 3) -> str:
    """Call Gemini API with exponential backoff retry on transient errors."""
    last_error = None
    for attempt in range(max_retries):
        try:
            response = gemini_client.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
            )
            return response.text
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            # Only retry on transient errors
            if any(keyword in error_str for keyword in ["500", "503", "timeout", "rate", "overloaded", "unavailable"]):
                wait_time = (2 ** attempt)  # 1s, 2s, 4s
                logger.warning("Gemini API transient error (attempt %d/%d), retrying in %ds: %s", attempt + 1, max_retries, wait_time, e)
                await asyncio.sleep(wait_time)
            else:
                raise
    raise last_error


def _prepare_chat_context(body: ChatRequest, user: Dict) -> tuple:
    """Shared logic: validate, get/create session, build prompt. Returns (session_id, session, system_prompt, current_stage)."""
    user_id = user["uid"]

    # Get or create session
    if body.session_id:
        session = firestore_service.get_session(body.session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")
        if session.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        session_id = body.session_id
    else:
        session_id = firestore_service.create_session(user_id, body.message)
        session = firestore_service.get_session(session_id)

    # Determine current stage
    current_stage = body.stage or session.get("stage", "discovery")
    messages = session.get("messages", [])

    # Build context from previous messages (configurable window)
    context = ""
    if messages:
        recent_messages = messages[-settings.context_window_size:]
        context = "\n".join(
            [
                f"{'User' if m.get('isUser') else 'Assistant'}: {m['content']}"
                for m in recent_messages
            ]
        )

    # Build the prompt
    system_prompt = CAREER_ADVISOR_PROMPT.format(
        stage=current_stage.upper(),
        context=context if context else "This is the start of the conversation.",
    )

    return session_id, session, system_prompt, current_stage


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.rate_limit_chat)
async def chat(request: Request, body: ChatRequest, user: Dict = Depends(get_current_user)):
    """
    Process a chat message and return AI response (non-streaming).
    Requires authentication.
    """
    # Validate stage if provided
    if body.stage and body.stage not in VALID_STAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid stage '{body.stage}'. Must be one of: {', '.join(sorted(VALID_STAGES))}",
        )

    if not gemini_client:
        raise HTTPException(
            status_code=500,
            detail="AI service is not configured. Please contact the administrator.",
        )

    try:
        session_id, session, system_prompt, current_stage = _prepare_chat_context(body, user)
        contents = build_prompt_contents(system_prompt, body.message, session.get("messages", []))

        # Call Gemini with retry
        ai_response = await call_gemini_with_retry(contents)

        # Parse AI-driven stage progression
        ai_response, next_stage = parse_stage_from_response(ai_response, current_stage)

        # Update session in Firestore
        firestore_service.update_session(session_id, body.message, ai_response, next_stage)

        # Generate suggestions
        suggestions = generate_suggestions(next_stage, ai_response)

        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            stage=next_stage,
            suggestions=suggestions,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error generating AI response: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating the response. Please try again.",
        )


@router.post("/chat/stream")
@limiter.limit(settings.rate_limit_chat)
async def chat_stream(request: Request, body: ChatRequest, user: Dict = Depends(get_current_user)):
    """
    Stream a chat response via Server-Sent Events.
    Requires authentication.
    """
    if body.stage and body.stage not in VALID_STAGES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid stage '{body.stage}'. Must be one of: {', '.join(sorted(VALID_STAGES))}",
        )

    if not gemini_client:
        raise HTTPException(
            status_code=500,
            detail="AI service is not configured. Please contact the administrator.",
        )

    try:
        session_id, session, system_prompt, current_stage = _prepare_chat_context(body, user)
        contents = build_prompt_contents(system_prompt, body.message, session.get("messages", []))
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error preparing stream context: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to prepare chat context.")

    async def event_generator():
        full_response = ""
        try:
            response_stream = gemini_client.models.generate_content_stream(
                model=settings.gemini_model,
                contents=contents,
            )
            for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    data = json.dumps({"token": chunk.text, "done": False})
                    yield f"data: {data}\n\n"

            # Parse stage from full response
            cleaned_response, next_stage = parse_stage_from_response(full_response, current_stage)
            suggestions = generate_suggestions(next_stage, cleaned_response)

            # Update session in Firestore
            firestore_service.update_session(session_id, body.message, cleaned_response, next_stage)

            # Send final event
            final_data = json.dumps({
                "token": "",
                "done": True,
                "session_id": session_id,
                "stage": next_stage,
                "suggestions": suggestions,
            })
            yield f"data: {final_data}\n\n"

        except Exception as exc:
            logger.error("Streaming error: %s", exc, exc_info=True)
            error_data = json.dumps({"error": "An error occurred while generating the response.", "done": True})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
