"""
Chat endpoint with Gemini AI integration
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import google.generativeai as genai

from app.config import settings
from app.routes.session import get_or_create_session, update_session, sessions

router = APIRouter()

# Configure Gemini
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

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

Always end your response with 1-2 relevant follow-up questions or suggestions to keep the conversation moving forward.

Previous context from this conversation:
{context}
"""


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    stage: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    stage: str
    suggestions: List[str]


def generate_suggestions(stage: str, response: str) -> List[str]:
    """Generate contextual suggestions based on stage"""
    suggestions_map = {
        "discovery": [
            "Tell me about your educational background",
            "What skills do you enjoy using most?",
            "What's your dream job environment?"
        ],
        "assessment": [
            "What technical skills do you have?",
            "Describe your biggest professional achievement",
            "What areas do you want to improve?"
        ],
        "exploration": [
            "Tell me more about this career path",
            "What would a typical day look like?",
            "What's the salary range for this role?"
        ],
        "roadmap": [
            "Create a 90-day action plan",
            "What courses should I start with?",
            "How do I build a portfolio?"
        ]
    }
    return suggestions_map.get(stage, suggestions_map["discovery"])[:3]


def determine_next_stage(current_stage: str, message_count: int) -> str:
    """Determine if we should progress to the next stage"""
    stages = ["discovery", "assessment", "exploration", "roadmap"]
    current_index = stages.index(current_stage) if current_stage in stages else 0
    
    # Progress stage roughly every 4-6 messages
    if message_count > 0 and message_count % 5 == 0:
        next_index = min(current_index + 1, len(stages) - 1)
        return stages[next_index]
    
    return current_stage


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Process a chat message and return AI response
    """
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=500, 
            detail="Gemini API key not configured. Please set GEMINI_API_KEY in .env"
        )
    
    try:
        # Get or create session
        session_id, session = get_or_create_session(request.session_id, request.message)
        
        # Determine current stage
        current_stage = request.stage or session.get("stage", "discovery")
        message_count = len(session.get("messages", []))
        
        # Build context from previous messages
        context = ""
        if session.get("messages"):
            recent_messages = session["messages"][-6:]  # Last 3 exchanges
            context = "\n".join([
                f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}" 
                for m in recent_messages
            ])
        
        # Build the prompt
        system_prompt = CAREER_ADVISOR_PROMPT.format(
            stage=current_stage.upper(),
            context=context if context else "This is the start of the conversation."
        )
        
        # Generate response with Gemini
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        chat_history = [{"role": "user", "parts": [system_prompt]}]
        chat_history.append({"role": "model", "parts": ["I understand. I'm Careerra, your AI career advisor. I'm ready to help guide you on your professional journey. How can I assist you today?"]})
        chat_history.append({"role": "user", "parts": [request.message]})
        
        response = model.generate_content(chat_history)
        ai_response = response.text
        
        # Determine next stage
        next_stage = determine_next_stage(current_stage, message_count + 1)
        
        # Update session
        update_session(
            session_id, 
            {"content": request.message}, 
            ai_response, 
            next_stage
        )
        
        # Generate suggestions
        suggestions = generate_suggestions(next_stage, ai_response)
        
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            stage=next_stage,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
