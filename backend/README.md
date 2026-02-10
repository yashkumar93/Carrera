# Careerra Backend API

Python FastAPI backend for the Careerra AI career guidance chatbot.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file with your API keys:
```bash
cp .env.example .env
# Edit .env with your GEMINI_API_KEY
```

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

- `POST /api/chat` - Conversational AI for career guidance
- `GET /api/session/{id}` - Get session info
- `DELETE /api/session/{id}` - Delete session
- `GET /api/health` - Health check
- `GET /api/stages` - Get conversation stages
- `POST /api/auth/verify-token` - Verify Firebase token
