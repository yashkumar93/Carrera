# Careerra — Comprehensive Project Documentation

**Version**: 2.0.0  
**Last Updated**: May 1, 2026  
**Project Type**: AI-powered career guidance platform (full-stack web application)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Services & Business Logic](#services--business-logic)
8. [Databases & Data Stores](#databases--data-stores)
9. [External Integrations](#external-integrations)
10. [Environment Configuration](#environment-configuration)
11. [API Reference](#api-reference)
12. [Setup & Installation](#setup--installation)
13. [Deployment](#deployment)
14. [Development Workflow](#development-workflow)
15. [Operational Considerations](#operational-considerations)
16. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Careerra** is an AI-powered career guidance and counseling platform that helps users discover their ideal career paths, assess their skills, and create actionable learning roadmaps through conversational AI and curated career knowledge.

### Key Features

- **AI Chat Advisor**: Single persistent chat per user with long-term memory (wiki-based knowledge accumulation)
- **Aptitude Assessments**: Career-fit quizzes with skill gap analysis and recommendations
- **Resume Parser**: Extract skills and experience from PDF resumes; auto-map to career paths
- **Career Exploration**: Compare careers side-by-side; view labor market data, salary ranges, and demand trends
- **Learning Roadmap**: Generate and track personalized learning plans with courses, certifications, and projects
- **Mentorship Marketplace**: Connect with mentors; request sessions and leave reviews
- **Community Forum**: Q&A forum with career guidance discussions and expert insights
- **Employer Integration**: Curated employer profiles with open roles linked to career recommendations
- **Public API**: Third-party developers can access career suggestion and assessment capabilities via API keys
- **PDF Export**: Export career plans and chat history as formatted PDFs
- **Multilingual Support**: English and Hindi (via `next-intl`)
- **User Onboarding**: Structured 5-question onboarding flow to build initial profile

### Target Users

- Students exploring career paths
- Career changers seeking guidance
- Professionals seeking skill development
- Users interested in labor market insights and salary benchmarks

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js)                             │
│   React 19 + TailwindCSS + Styled-Components + GSAP Animations         │
│   - App Router (file-based routing)                                     │
│   - Components: Chat, Assessment, Resume, Roadmap, Export, etc.        │
│   - Internationalization (en.json, hi.json)                            │
│   - Local state + Firebase Auth + Axios API calls                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    HTTP/HTTPS (CORS from localhost:3000)
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│                  REVERSE PROXY (Nginx) + SSL (Let's Encrypt)            │
│  - TLS termination                                                       │
│  - Rate limiting (configured per route)                                 │
│  - Request logging                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ├─────────────────────┬──────────────────┐
                                    │                     │                  │
┌───────────────────────────────┐   │   ┌─────────────────────────────┐   │
│   BACKEND (FastAPI + Uvicorn) │───┘   │  EXTERNAL SERVICES          │   │
│                               │       │  ┌──────────────────────────┐│   │
│ - /api endpoints              │       │  │ Groq LLM API             ││   │
│ - Auth middleware             │       │  │ (chat, assessments, etc)││   │
│ - Rate limiting (slowapi)     │       │  └──────────────────────────┘│   │
│ - Background tasks (APScheduler) │    │  ┌──────────────────────────┐│   │
│ - WebSocket support (streaming)  │    │  │ Firebase Auth           ││   │
│ - Request/response validation    │    │  │ (JWT verification)      ││   │
└───────────────────────────────┘       │  └──────────────────────────┘│   │
                                        │  ┌──────────────────────────┐│   │
                                        │  │ Pinecone Vector DB      ││   │
                                        │  │ (community insights)     ││   │
                                        │  └──────────────────────────┘│   │
                                        └─────────────────────────────┘   │
                                                                           │
        ┌──────────────────────────────────────────────────────────────┐  │
        │         PERSISTENT DATA & INDEXES                           │  │
        │ ┌────────────────────────────────────────────────────────┐  │  │
        │ │ Firestore (Google Cloud Firestore)                   │  │  │
        │ │ - Users, profiles, sessions, chat messages           │  │  │
        │ │ - Assessments, resumes, roadmap items                │  │  │
        │ │ - Mentorship requests, reviews                        │  │  │
        │ │ - Community posts, replies, votes                     │  │  │
        │ │ - Employers, API keys, wiki pages                    │  │  │
        │ │ - Careers, courses, certs, projects                  │  │  │
        │ │ - Community insights, labor market cache              │  │  │
        │ └────────────────────────────────────────────────────────┘  │  │
        │ ┌────────────────────────────────────────────────────────┐  │  │
        │ │ ChromaDB (Local Vector Store)                         │  │  │
        │ │ - Path: backend/chroma_db/                            │  │  │
        │ │ - Semantic career search index                        │  │  │
        │ └────────────────────────────────────────────────────────┘  │  │
        │ ┌────────────────────────────────────────────────────────┐  │  │
        │ │ Firebase Service Account JSON                         │  │  │
        │ │ - Admin SDK credential (mounted, not committed)       │  │  │
        │ └────────────────────────────────────────────────────────┘  │  │
        └──────────────────────────────────────────────────────────────┘  │
                                                                           │
        ┌──────────────────────────────────────────────────────────────┐  │
        │         BACKEND SERVICE LAYER                              │  │
        │  firestore_service | llm_service | wiki_service            │  │
        │  knowledge_base | career_index | pinecone_insights         │  │
        │  labor_market | scheduler | (auth middleware)              │  │
        └──────────────────────────────────────────────────────────────┘  │
                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19.2.3
- **Styling**: TailwindCSS 4.1.18 + Styled-Components 6.1.19
- **Animations**: GSAP 3.14.2 + tailwindcss-animate 1.0.7
- **Charts/Visualization**: Recharts 3.8.1
- **Icons**: Lucide React 0.562.0 + React Icons 5.5.0
- **Markdown**: React Markdown 10.1.0
- **Internationalization**: next-intl 4.9.1 (English, Hindi)
- **HTTP Client**: Axios 1.13.2
- **Authentication**: Firebase Web SDK 12.7.0
- **Build Tool**: PostCSS + Autoprefixer + Next.js CLI

### Backend
- **Framework**: FastAPI 0.100.0+
- **Server**: Uvicorn (standard ASGI)
- **LLM Integration**: Groq API (groq ≥0.18.0)
- **Auth**: Firebase Admin SDK 6.0.0+
- **Database**: Firestore (via firebase-admin)
- **Vector DB (Local)**: ChromaDB ≥0.5.0
- **Vector DB (Optional)**: Pinecone ≥5.0.0
- **Embeddings**: Sentence-Transformers 2.7.0+
- **Rate Limiting**: slowapi 0.1.9+
- **File Processing**: pdfplumber 0.11.0 (PDF parsing)
- **PDF Generation**: fpdf2 2.8.0
- **Background Jobs**: APScheduler 3.10.0+
- **HTTP Multipart**: python-multipart 0.0.6
- **Configuration**: python-dotenv 1.0.0 + Pydantic ≥2.0.0 + pydantic-settings ≥2.0.0

### Infrastructure & Deployment
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx 1.27-alpine
- **SSL/TLS**: Let's Encrypt (Certbot)
- **Container Registry**: GitHub Container Registry (GHCR)
- **CI/CD**: GitHub Actions (deploy on image push)
- **Cloud Services**: Google Cloud Firestore, Firebase Auth, Groq API, Pinecone

---

## Project Structure

```
careerra/
├── backend/
│   ├── main.py                          # FastAPI app entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── env.example                      # Sample .env template
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                    # Settings (Pydantic)
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   └── auth.py                  # Firebase token verification
│   │   ├── routes/                      # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── chat.py                  # Chat + streaming
│   │   │   ├── auth.py                  # Token verification
│   │   │   ├── session.py               # Session & profile CRUD
│   │   │   ├── health.py                # Health check
│   │   │   ├── admin.py                 # Admin analytics & user mgmt
│   │   │   ├── resume.py                # PDF parsing & skill extraction
│   │   │   ├── assessment.py            # Quiz generation & scoring
│   │   │   ├── mentorship.py            # Mentor marketplace
│   │   │   ├── community.py             # Forum Q&A
│   │   │   ├── employers.py             # Employer partnerships
│   │   │   ├── public_api.py            # Public API + key management
│   │   │   ├── compare.py               # Career comparison
│   │   │   ├── roadmap.py               # Learning roadmap
│   │   │   ├── export.py                # PDF export
│   │   │   └── labor_market.py          # BLS/SOC data
│   │   └── services/                    # Business logic
│   │       ├── __init__.py
│   │       ├── firestore_service.py     # Firestore CRUD ops
│   │       ├── llm_service.py           # Groq wrapper + embeddings
│   │       ├── wiki_service.py          # Personal wiki memory
│   │       ├── knowledge_base.py        # Career/course/cert lookups
│   │       ├── career_index.py          # ChromaDB semantic search
│   │       ├── pinecone_insights.py     # Pinecone query (community insights)
│   │       ├── labor_market.py          # BLS data retrieval
│   │       └── scheduler.py             # Background tasks
│   ├── chroma_db/                       # ChromaDB persistent storage
│   │   ├── chroma.sqlite3
│   │   └── [vector collections]
│   ├── carrerbots-firebase-adminsdk-*.json  # Firebase SA (SECRET)
│   └── scripts/                         # Utility scripts
│       ├── __init__.py
│       ├── index_careers.py             # Index careers to ChromaDB
│       ├── pinecone_upsert.py           # Load Reddit data to Pinecone
│       ├── seed_knowledge_base.py       # Bootstrap career data
│       └── [other indexing scripts]
│
├── app/                                 # Frontend (Next.js)
│   ├── page.js                          # Home page
│   ├── layout.js                        # Root layout
│   ├── globals.css                      # Global styles
│   ├── admin/
│   │   └── page.js
│   ├── community/
│   │   └── page.js
│   ├── developers/
│   │   └── page.js
│   ├── employers/
│   │   └── page.js
│   ├── memory/
│   │   └── page.js
│   ├── mentors/
│   │   └── page.js
│   └── roadmap/
│       └── page.js
│
├── components/                          # React components
│   ├── AptitudeAssessment.jsx
│   ├── AuthPage.jsx
│   ├── CareerChat.jsx
│   ├── CareerComparison.jsx
│   ├── ChatInterface.jsx
│   ├── LandingPage.jsx
│   ├── LanguageSwitcher.jsx
│   ├── OnboardingChat.jsx
│   ├── ProfileSettings.jsx
│   ├── ResumeUpload.jsx
│   ├── hooks/
│   │   ├── use-auto-resize-textarea.js
│   │   └── use-file-input.js
│   ├── rich/                            # Rich component library
│   │   ├── ActionPlan.jsx
│   │   ├── CareerCard.jsx
│   │   ├── CertificationCard.jsx
│   │   ├── CommunityInsight.jsx
│   │   ├── ComparisonTable.jsx
│   │   ├── ExportPreview.jsx
│   │   ├── LearningRoadmap.jsx
│   │   ├── ProgressCheckIn.jsx
│   │   ├── ProjectIdea.jsx
│   │   ├── RichResponseRenderer.jsx
│   │   ├── SalaryBreakdown.jsx
│   │   └── SkillRadar.jsx
│   └── ui/                              # UI primitives
│       ├── ai-input-with-file.jsx
│       ├── animated-shiny-text.jsx
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── chat-input.jsx
│       ├── chat-suggestions.jsx
│       ├── claude-chat-input.jsx
│       ├── flip-words.jsx
│       └── textarea.jsx
│
├── hooks/                               # Shared hooks (if any)
│
├── i18n/
│   └── request.js                       # i18n config (next-intl)
│
├── lib/
│   ├── api.js                           # Axios client + helpers
│   ├── firebase.js                      # Firebase config + utils
│   └── utils.js                         # General utilities
│
├── messages/                            # i18n translations
│   ├── en.json
│   └── hi.json
│
├── nginx/
│   └── default.conf                     # Nginx config for reverse proxy
│
├── public/                              # Static assets
│
├── scripts/
│   └── deploy/
│       ├── bootstrap-deploy.sh
│       ├── rollback.sh
│       └── server-setup.sh
│
├── .github/
│   └── workflows/                       # GitHub Actions CI/CD
│
├── package.json                         # Frontend dependencies
├── jsconfig.json                        # JS config
├── next.config.mjs                      # Next.js config
├── tailwind.config.js                   # Tailwind config
├── postcss.config.js                    # PostCSS config
├── eslint.config.mjs                    # ESLint config
│
├── docker-compose.yml                   # Compose for full-stack deploy
├── Dockerfile.backend                   # Backend container image
├── Dockerfile.frontend                  # Frontend container image
│
├── components.json                      # UI component config
├── firebase.json                        # Firebase config
├── firestore.indexes.json               # Firestore indexes
├── firestore.rules                      # Firestore security rules
│
├── docs/                                # Documentation
│   └── PROJECT_DOCUMENTATION.md         # This file
│
└── README.md                            # Quick start guide
```

---

## Backend Architecture

### FastAPI Application Lifecycle

**Entry Point**: `backend/main.py`

```python
# Creates FastAPI app with:
# - Lifespan manager (starts APScheduler, cleans up on shutdown)
# - CORS middleware
# - Request logging middleware
# - Rate limiting (slowapi)
# - Routes included under /api prefix

# Root endpoint: GET / (returns status + docs link)
```

### Middleware & Security

1. **CORS Middleware**: Configurable allowed origins from `CORS_ORIGINS_STR`
2. **Request Logging**: All requests logged with method, path, status, latency
3. **Rate Limiting**: slowapi-based limits applied per route:
   - Chat routes: `rate_limit_chat` (default: 20/minute)
   - Other routes: `rate_limit_default` (default: 60/minute)
4. **Authentication**: Firebase ID token verification on protected routes via `get_current_user` dependency
5. **Admin Guard**: `require_admin` dependency for admin-only endpoints

### API Routes (prefix: `/api`)

#### Health & Status
- **GET** `/api/health` — Service health + Firestore connectivity check

#### Authentication
- **POST** `/api/auth/verify-token` — Verify Firebase ID token; upsert user profile

#### Chat (Core Feature)
- **POST** `/api/chat` — Synchronous chat (returns JSON)
- **POST** `/api/chat/stream` — Server-sent-events streaming
- **GET** `/api/chat/history` — Get all messages (oldest first)
- **DELETE** `/api/chat/history` — Clear chat history + reset wiki
- **GET** `/api/chat/wiki` — Get full personal wiki (6 pages)
- **GET** `/api/chat/wiki/updates` — Wiki update audit trail

#### Session & Profile Management
- **GET** `/api/sessions` — List user sessions (paginated)
- **GET** `/api/session/{session_id}` — Get session details
- **PATCH** `/api/session/{session_id}` — Rename session
- **DELETE** `/api/session/{session_id}` — Delete session
- **POST** `/api/session/{session_id}/feedback` — Record feedback (thumbs-up/down)
- **GET** `/api/session/{session_id}/export` — Export as Markdown
- **GET** `/api/profile` — Get user profile
- **PUT** `/api/profile` — Update profile
- **DELETE** `/api/account` — Delete all data (GDPR)
- **GET** `/api/stages` — Get available conversation stages

#### Admin Only
- **GET** `/api/admin/stats` — Platform-wide aggregate metrics
- **GET** `/api/admin/feedback-analytics` — Feedback analysis + quality signals
- **GET** `/api/admin/users` — List all users (paginated)
- **PATCH** `/api/admin/users/{target_uid}/role` — Assign user role (user|admin|counselor)
- **GET** `/api/admin/users/{target_uid}` — Get specific user profile

#### Resume Processing
- **POST** `/api/resume/parse` — Upload PDF; extract skills/experience/education; auto-update profile
- **GET** `/api/resume/analysis` — Retrieve most recent resume analysis

#### Aptitude Assessments
- **POST** `/api/assessment/generate` — Generate career-fit quiz (LLM-generated JSON)
- **POST** `/api/assessment/score` — Score submitted answers; return skill gap report
- **GET** `/api/assessment/history` — List past assessments (newest first)

#### Mentorship Marketplace
- **POST** `/api/mentors/register` — Register/update mentor profile
- **GET** `/api/mentors` — Browse mentors (filter by expertise)
- **GET** `/api/mentors/me` — Get current user's mentor profile
- **GET** `/api/mentors/{mentor_id}` — Get mentor profile
- **POST** `/api/mentors/{mentor_id}/request` — Request mentorship
- **GET** `/api/mentors/requests/sent` — My sent requests
- **GET** `/api/mentors/requests/received` — Received requests (as mentor)
- **PATCH** `/api/mentors/requests/{request_id}/status` — Update status (accepted|declined|completed)
- **POST** `/api/mentors/{mentor_id}/review` — Submit review + rating

#### Community Q&A Forum
- **POST** `/api/community/posts` — Create post
- **GET** `/api/community/posts` — List posts (newest first, filter by tag)
- **GET** `/api/community/posts/{post_id}` — Get post + replies
- **DELETE** `/api/community/posts/{post_id}` — Delete post (author or admin)
- **POST** `/api/community/posts/{post_id}/replies` — Add reply
- **POST** `/api/community/posts/{post_id}/vote` — Toggle upvote
- **GET** `/api/community/tags` — List valid tags

#### Employer Partnerships
- **GET** `/api/employers` — List employers (filter by career)
- **GET** `/api/employers/{employer_id}` — Get employer profile
- **POST** `/api/employers` — Create employer (admin only)
- **PATCH** `/api/employers/{employer_id}` — Update employer (admin only)
- **PATCH** `/api/employers/{employer_id}/verify` — Verify employer (admin only)

#### Career Comparison
- **POST** `/api/compare` — Compare 2–3 careers side-by-side (LLM-enriched)

#### Learning Roadmap
- **POST** `/api/roadmap/generate` — Generate AI roadmap (LLM JSON); save items
- **GET** `/api/roadmap` — Get roadmap items grouped by status (todo|in_progress|completed)
- **POST** `/api/roadmap/items` — Add roadmap item
- **PATCH** `/api/roadmap/items/{item_id}` — Update item (status, title, description, week)
- **DELETE** `/api/roadmap/items/{item_id}` — Delete item
- **DELETE** `/api/roadmap` — Clear all roadmap items

#### PDF Export
- **GET** `/api/session/{session_id}/export/pdf` — Export session as formatted PDF
- **GET** `/api/chat/export/pdf` — Export full chat history as PDF

#### Labor Market Data
- **GET** `/api/labor-market/{career}` — Get labor market data (SOC code, wages, projections)
- **POST** `/api/labor-market/batch` — Batch lookup (max 10 careers)

#### Public API (API-key protected)
- **POST** `/api/keys` — Create API key (authenticated user)
- **GET** `/api/keys` — List API keys
- **DELETE** `/api/keys/{key_id}` — Revoke API key
- **POST** `/api/v1/careers/suggest` — Public career suggestion (requires X-API-Key header)
- **GET** `/api/v1/health` — Public health check (requires X-API-Key header)

---

## Frontend Architecture

### Framework & Routing

- **Framework**: Next.js 16.1.1 (App Router)
- **Routing**: File-based routing in `app/` directory
- **Pages**: `page.js` files at different route levels (home, admin, mentors, roadmap, etc.)
- **Layout**: `app/layout.js` wraps all pages; `app/globals.css` for global styles

### Component Hierarchy

**Top-Level Pages** (in `app/`):
- `page.js` — Home / Landing page
- `admin/page.js` — Admin dashboard
- `community/page.js` — Community forum
- `developers/page.js` — Developer docs (public API)
- `employers/page.js` — Employer directory
- `memory/page.js` — User's personal wiki/memory view
- `mentors/page.js` — Mentor marketplace
- `roadmap/page.js` — Learning roadmap tracker

**Component Library** (`components/`):
- **Main Features**:
  - `LandingPage.jsx` — Hero + feature overview
  - `AuthPage.jsx` — Login / signup flow
  - `CareerChat.jsx` — Main chat interface
  - `OnboardingChat.jsx` — 5-question onboarding
  - `AptitudeAssessment.jsx` — Quiz UI + scoring
  - `ResumeUpload.jsx` — PDF upload + parsing results
  - `CareerComparison.jsx` — Side-by-side comparison
  - `ChatInterface.jsx` — Wrapper for chat stream + messages
  - `ProfileSettings.jsx` — User profile editor
  - `LanguageSwitcher.jsx` — i18n language toggle

- **Rich Components** (`components/rich/`): Specialized data visualizations
  - `ActionPlan.jsx` — 30/60/90 day milestones
  - `CareerCard.jsx` — Single career with fit score + salary + skills
  - `CertificationCard.jsx` — Certification details + cost + duration
  - `CommunityInsight.jsx` — Reddit quote + sentiment + source
  - `ComparisonTable.jsx` — 2–3 careers in tabular form
  - `ExportPreview.jsx` — PDF export preview
  - `LearningRoadmap.jsx` — Courses/certs/projects in roadmap form
  - `ProgressCheckIn.jsx` — Milestone progress tracker
  - `ProjectIdea.jsx` — Portfolio project suggestions
  - `RichResponseRenderer.jsx` — Dispatcher for rich component types
  - `SalaryBreakdown.jsx` — Salary percentiles + experience levels (charts)
  - `SkillRadar.jsx` — Current vs required skills (radar chart)

- **UI Primitives** (`components/ui/`): Reusable elements
  - `chat-input.jsx`, `ai-input-with-file.jsx` — Input fields
  - `chat-suggestions.jsx` — Suggestion chips
  - `avatar.jsx`, `badge.jsx` — Display components
  - `textarea.jsx` — Auto-resizing textarea
  - `animated-shiny-text.jsx`, `flip-words.jsx` — Animation primitives

- **Hooks** (`components/hooks/`):
  - `use-auto-resize-textarea.js` — Textarea auto-expand on input
  - `use-file-input.js` — File picker helper

### Styling & Animations

- **Tailwind CSS**: Utility-first CSS framework (4.1.18)
- **Styled-Components**: CSS-in-JS for component scoping (6.1.19)
- **GSAP**: Timeline-based animations (3.14.2)
- **tailwindcss-animate**: Pre-built animations
- **Global Styles**: `app/globals.css`

### State Management & API Integration

- **Authentication**: Firebase Web SDK (client-side token generation)
- **HTTP Client**: Axios (lib/api.js) with default base URL + error handling
- **API Base**: Points to backend at `/api` (proxied by nginx in prod)
- **Local State**: React hooks (`useState`, `useContext`)
- **Data Fetching**: Fetch patterns in component `useEffect` hooks

### Internationalization (i18n)

- **Library**: next-intl (4.9.1)
- **Config**: `i18n/request.js`
- **Translations**: JSON files in `messages/`
  - `en.json` — English
  - `hi.json` — Hindi
- **Switch Component**: `LanguageSwitcher.jsx`
- **Supported Routes**: All main pages auto-support language switching

### Data Visualization

- **Recharts** (3.8.1): Charts for salary breakdowns, skill radars, progress
- **Lucide React** (0.562.0): Modern SVG icons
- **React Icons** (5.5.0): Icon library fallback

---

## Services & Business Logic

### Core Services (backend/app/services/)

#### firestore_service.py
- **Role**: Central Firestore wrapper
- **Key Functions**:
  - `init_firebase()` — Initialize Admin SDK
  - `get_firestore_client()` — Return Firestore client (idempotent)
  - **Session CRUD**: `create_session`, `get_session`, `get_user_sessions`, `update_session`, `delete_session`
  - **Profile Management**: `get_user_profile`, `update_user_profile`, `delete_user_profile`
  - **Chat Messages**: `add_chat_message`, `get_chat_history`, `get_recent_messages`, `clear_chat_history`
  - **Assessments**: `save_assessment_result`, `get_assessment_history`
  - **Mentorship**: `register_mentor`, `get_mentor`, `list_mentors`, `create_mentorship_request`, `add_mentor_review`
  - **Community**: `create_post`, `list_posts`, `get_post`, `add_reply`, `vote_post`, `delete_post`
  - **API Keys**: `generate_api_key`, `list_api_keys`, `revoke_api_key`, `verify_api_key`
  - **Admin Analytics**: `get_admin_stats`, `get_feedback_analytics`, `get_all_users`
  - **Health Check**: `check_firestore_health`

#### llm_service.py
- **Role**: Groq LLM abstraction + embeddings
- **Key Functions**:
  - `is_configured()` — Check if Groq API key is set
  - `generate_text(prompt)` — Sync text generation
  - `stream_text(prompt)` — Async streaming (yields tokens)
  - `embed_text(text)` — Embed text with sentence-transformers
- **Dependencies**: Groq API, sentence-transformers library

#### wiki_service.py
- **Role**: Personal wiki memory (6-page markdown per user)
- **Pages**: profile, explorations, roadmap, decisions, session_log, courses_tracking
- **Key Functions**:
  - `get_page(user_id, slug)` — Retrieve page with version info
  - `set_page(user_id, slug, content)` — Upsert page (increments version)
  - `get_full_wiki(user_id)` — Get all 6 pages
  - `update_wiki(user_id, user_msg, ai_response)` — Buffered LLM-driven update
  - `build_wiki_context(user_id)` — Compile wiki into system prompt context
- **Update Strategy**: Buffered every 3 user messages (saves LLM calls); applies LLM-driven rules for which pages to update
- **Audit Trail**: Logged to `users/{uid}/wiki_updates`

#### knowledge_base.py
- **Role**: Curated career/course/cert/project data retrieval
- **Key Functions**:
  - **Careers**: `search_careers`, `find_careers_by_keyword`, `list_all_careers`
  - **Courses**: `get_courses_for_career`, `search_courses`
  - **Certifications**: `get_certs_for_career`, `is_cert_whitelisted` (fuzzy match)
  - **Projects**: `get_projects_for_career`
  - **Insights**: `get_insights_for_career` (from Firestore)
  - `build_kb_context(query)` — Assemble knowledge block for prompts (semantic search first, keyword fallback)
- **Cert Whitelist**: In-memory cache of recognized certifications; strict on what AI can recommend

#### career_index.py
- **Role**: ChromaDB semantic career search
- **Key Functions**:
  - `reindex_all()` — Embed all careers from Firestore; upsert to ChromaDB
  - `search(query, n)` — Semantic search; return top-N careers with relevance scores
- **Storage**: `./chroma_db/` (persistent)
- **Embedding Model**: Configured in settings; defaults to sentence-transformers/all-MiniLM-L6-v2

#### pinecone_insights.py
- **Role**: Query Pinecone for community insights (Reddit career posts)
- **Key Functions**:
  - `is_available()` — Check if Pinecone is configured
  - `query_insights(query, career_id, top_k)` — Semantic search + metadata filtering
- **Metadata Expected**: career_id, sentiment, quality_score, reddit_topic, post_date, key_takeaway
- **Embedding**: Lazy-loaded sentence-transformers to match index embedding model

#### labor_market.py
- **Role**: Fetch BLS/SOC occupation data and cache in Firestore
- **Key Functions**: (Used by routes, not directly exposed in services)
  - Likely: `get_labor_market_data(career)`, `get_labor_market_batch(careers)`

#### scheduler.py
- **Role**: Background job scheduler (APScheduler)
- **Purpose**: Handle periodic tasks (cron jobs) started during FastAPI lifespan
- **Examples**: (Implementation likely includes cleanup, cache refresh, etc.)

---

## Databases & Data Stores

### Firestore (Primary Database)

**Collections & Schema** (representative):

```
users/{uid}
  - email: string
  - display_name: string
  - photo_url: string
  - role: string (user | admin | counselor)
  - onboarding_complete: boolean
  - career_interests: string[]
  - skills: string[]
  - experience_level: string (student | entry | mid | senior | career_changer)
  - education: string
  - bio: string
  - chat_stage: string (discovery | assessment | exploration | roadmap)
  - resume_analysis: object (full parsed resume)
  - createdAt: timestamp
  - updatedAt: timestamp
  → Sub-collections:
      messages/{msg_id}
        - content: string
        - isUser: boolean
        - timestamp: timestamp
        - createdAt: timestamp (ISO string)
      
      wiki/{page_slug}
        - slug: string
        - content: string (markdown)
        - version: int
        - word_count: int
        - updated_at: timestamp
      
      wiki_updates/{entry_id}
        - pages_updated: string[]
        - summary: string
        - created_at: timestamp
      
      assessments/{result_id}
        - career: string
        - total_questions: int
        - correct_count: int
        - score_percent: float
        - fit_level: string
        - skill_scores: object
        - strengths: string[]
        - gaps: string[]
        - priority_learning: object[]
        - summary: string
        - createdAt: timestamp
      
      roadmap/{item_id}
        - title: string
        - description: string
        - category: string (course | project | cert | skill | milestone)
        - week: int
        - priority: string
        - estimated_hours: int
        - resources: string[]
        - status: string (todo | in_progress | completed)
        - createdAt: timestamp
        - updatedAt: timestamp

sessions/{session_id}
  - userId: string
  - title: string
  - stage: string
  - messages: object[] (inline array of {content, isUser, timestamp})
  - feedbacks: object[] (inline array of {rating, message_snapshot, comment, created_at})
  - createdAt: timestamp
  - updatedAt: timestamp

mentors/{mentor_uid}
  - uid: string
  - name: string
  - bio: string
  - expertise: string[]
  - experience_years: int
  - availability: string
  - pricing: string
  - linkedin_url: string
  - languages: string[]
  - rating: float
  - review_count: int
  - verified: boolean
  - active: boolean
  - createdAt: timestamp
  - updatedAt: timestamp
  → Sub-collections:
      reviews/{review_id}
        - reviewer_id: string
        - rating: float (1-5)
        - comment: string
        - createdAt: timestamp

mentorship_requests/{request_id}
  - requester_id: string
  - mentor_id: string
  - message: string
  - goals: string
  - preferred_schedule: string
  - status: string (pending | accepted | declined | completed)
  - createdAt: timestamp
  - updatedAt: timestamp

community_posts/{post_id}
  - author_id: string
  - author_name: string
  - title: string
  - content: string
  - tags: string[]
  - upvotes: int
  - reply_count: int
  - voters: string[] (user IDs who upvoted)
  - createdAt: timestamp
  - updatedAt: timestamp
  → Sub-collections:
      replies/{reply_id}
        - author_id: string
        - content: string
        - upvotes: int
        - createdAt: timestamp

employers/{employer_id}
  - name: string
  - industry: string
  - description: string
  - hiring_for: string[] (career paths)
  - open_roles: object[] ({title, location, type, url})
  - company_size: string
  - website: string
  - logo_url: string
  - locations: string[]
  - remote_friendly: boolean
  - verified: boolean
  - active: boolean
  - createdAt: timestamp
  - updatedAt: timestamp

api_keys/{key_id}
  - user_id: string
  - name: string
  - key_hash: string (SHA256)
  - key_preview: string (first 10 chars + "...")
  - request_count: int
  - last_used: timestamp
  - active: boolean
  - createdAt: timestamp

careers/{career_id}
  - display_name: string
  - sector: string
  - sub_sector: string
  - description: string
  - region: string (GLOBAL | specific region)
  - education_typical: string
  - salary_range_usd: object ({min, max})
  - salary_range_inr: object ({min, max})
  - growth_rate: string (e.g., "+36% by 2033")
  - skills_required: string[]
  - aliases: string[] (alternate names)
  - reddit_post_count: int
  - created_at: timestamp

courses/{course_id}
  - external_id: string
  - platform: string (Coursera, edX, etc.)
  - title: string
  - description: string
  - url: string
  - partner_name: string
  - duration_hours: int
  - difficulty: string (beginner | intermediate | advanced)
  - cost_usd: number (or null for free)
  - cost_inr: number
  - rating: float
  - domain: string
  - skills_taught: string[]
  - career_ids: string[] (linked careers)
  - updated_at: timestamp

certifications/{cert_id}
  - name: string
  - issuing_body: string (AWS, Google, Microsoft, etc.)
  - cost_usd: number
  - cost_inr: number
  - time_to_complete: string
  - validity_years: int
  - prerequisites: string[]
  - skills_validated: string[]
  - value_tier: string (high | medium | low)
  - career_ids: string[]
  - community_rating: float
  - updated_at: timestamp

project_ideas/{project_id}
  - career_id: string
  - title: string
  - description: string
  - difficulty: string (beginner | intermediate | advanced)
  - skills_practiced: string[]
  - estimated_hours: int
  - starter_url: string
  - created_at: timestamp

community_insights/{insight_id}
  - career_id: string
  - insight_type: string (day_in_life | salary_info | cert_review | etc.)
  - title: string
  - raw_text: string
  - key_takeaway: string
  - sentiment: string (positive | negative | mixed | neutral)
  - salary_mentioned: boolean
  - salary_context: string
  - certs_mentioned: string[]
  - courses_mentioned: string[]
  - reddit_topic: string
  - source_url: string
  - post_date: string (ISO date)
  - word_count: int
  - quality_score: float (0-10)
  - created_at: timestamp
```

### ChromaDB (Local Vector Store)

- **Path**: `backend/chroma_db/`
- **Persistence**: SQLite3 + vector metadata
- **Collection**: `careers_index` (configurable in career_index.py)
- **Purpose**: Semantic career search
- **Embedding Model**: sentence-transformers (384-dim default)
- **Index Type**: HNSW (cosine similarity)
- **Records**: One per career; searchable text combines display_name, description, sector, skills, aliases, education

### Pinecone (Optional Hosted Vector DB)

- **Purpose**: Community insights (Reddit) semantic search
- **Expected Metadata Per Record**:
  ```json
  {
    "career_id": "data-scientist",
    "insight_type": "day_in_life",
    "title": "A Day in the Life of a Data Scientist",
    "key_takeaway": "...",
    "raw_text": "...",
    "sentiment": "positive",
    "quality_score": 7.5,
    "source_url": "https://reddit.com/r/...",
    "reddit_topic": "r/careerguidance",
    "post_date": "2024-03-15"
  }
  ```
- **Embedding Model**: sentence-transformers (must match at index/query time)
- **Indexing**: Done externally (scripts/pinecone_upsert.py)

### File Storage

- **Firebase Service Account JSON**: Mounted at runtime (Docker volume or secret)
  - Example: `/srv/careerra/firebase-sa.json` (production)
  - Backend path: `backend/carrerbots-firebase-adminsdk-...json` (dev)
- **Chroma DB**: Host-mounted volume in Docker Compose
  - Path: `/srv/careerra/chroma_db` (production)

---

## External Integrations

### 1. Groq LLM API
- **Purpose**: Text generation for chat, assessments, resume parsing, comparisons, wiki updates, roadmaps
- **Model**: Llama 3.3 70B Versatile (configurable)
- **Auth**: API key in `GROQ_API_KEY` environment variable
- **Cost Model**: Pay-per-token (streaming recommended for cost savings)
- **Latency**: ~2–5 seconds per request
- **Rate Limits**: Depends on subscription; recommended to implement exponential backoff

### 2. Firebase Admin SDK & Firestore
- **Purpose**: Authentication (ID token verification), primary database (Firestore)
- **Auth**: Service account JSON file (must be kept secret)
- **Firestore**:
  - Multi-region database (no data residency guarantee without Premium)
  - Automatic scaling
  - Real-time sync (not used in this app, but available)
- **Cost Model**: Reads/writes/deletes per million operations; storage per GB
- **Quotas**: 25 writes/sec per document by default (burst capacity available)

### 3. Sentence-Transformers (Hugging Face)
- **Purpose**: Text embeddings (local inference)
- **Model**: `all-MiniLM-L6-v2` (384-dim, ~90 MB)
- **Usage**: Career semantic search (ChromaDB) + Pinecone query embedding
- **Deployment**: Downloaded on first use; cached locally
- **Cost**: Free (open-source)

### 4. ChromaDB
- **Purpose**: Local vector store for semantic career search
- **Type**: Embedded database (no external service)
- **Storage**: SQLite + vector metadata
- **Cost**: Free (open-source)

### 5. Pinecone Vector Database (Optional)
- **Purpose**: Semantic search over community insights (Reddit data)
- **Auth**: API key in `PINECONE_API_KEY`
- **Index**: Configurable name (default: `career-insights`)
- **Namespace**: Optional multi-tenancy (configurable)
- **Cost Model**: Based on index size, storage, and API calls (free tier: 1 free index, 100K vectors)
- **Integration**: Query-only (no write/upsert from production backend)

### 6. Nginx (Reverse Proxy)
- **Purpose**: HTTP/HTTPS reverse proxy, TLS termination, rate limiting
- **Port**: 80 (HTTP) → 443 (HTTPS redirect)
- **SSL Certs**: Let's Encrypt (auto-renewed via Certbot)
- **Config**: `/srv/careerra/nginx/default.conf` (host-mounted)

### 7. Docker / Docker Compose
- **Purpose**: Containerized deployment orchestration
- **Services**:
  - `nginx` — Reverse proxy
  - `frontend` — Next.js app
  - `backend` — FastAPI server
- **Volumes**: Persist ChromaDB, Firebase SA JSON, Nginx logs, SSL certs
- **Registry**: GitHub Container Registry (GHCR)

### 8. GitHub Actions (CI/CD)
- **Purpose**: Automated image build, push to GHCR, trigger deploy on production
- **Workflow**: On push to main, build images, push with git SHA tag, deploy to DigitalOcean
- **Secrets**: Docker registry creds, deploy SSH key, etc.

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env` (based on `backend/env.example`):

```bash
# Groq LLM
GROQ_API_KEY=<your-groq-api-key>
GROQ_MODEL=llama-3.3-70b-versatile

# Firebase
FIREBASE_CREDENTIALS_PATH=../firebase-service-account.json

# CORS
CORS_ORIGINS_STR=http://localhost:3000,http://localhost:3001

# Environment
ENVIRONMENT=development

# Rate Limiting
RATE_LIMIT_CHAT=20/minute
RATE_LIMIT_DEFAULT=60/minute

# Pinecone (optional)
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_INDEX_NAME=career-insights
PINECONE_NAMESPACE=
PINECONE_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Input validation
MAX_MESSAGE_LENGTH=5000

# Context
CONTEXT_WINDOW_SIZE=20

# Pagination
MAX_SESSIONS_PER_PAGE=20
```

### Frontend Environment Variables

Create `.env.local` (Next.js convention):

```bash
# Firebase Web Config (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=<public-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Docker Compose Environment

Set in `.env` at repo root or pass to `docker compose`:

```bash
IMAGE_TAG=sha-abc1234  # Set by GitHub Actions deploy
GROQ_API_KEY=<your-groq-api-key>
PINECONE_API_KEY=<optional>
PINECONE_INDEX_NAME=career-insights
PINECONE_NAMESPACE=
CORS_ORIGINS_STR=https://yourdomain.com
ENVIRONMENT=production
GROQ_MODEL=llama-3.3-70b-versatile
```

---

## API Reference

### Summary of Key Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/chat` | Firebase | Chat (sync) |
| POST | `/api/chat/stream` | Firebase | Chat (streaming) |
| GET | `/api/chat/history` | Firebase | Get chat history |
| GET | `/api/chat/wiki` | Firebase | Get personal wiki |
| POST | `/api/resume/parse` | Firebase | Parse PDF resume |
| POST | `/api/assessment/generate` | Firebase | Generate quiz |
| POST | `/api/assessment/score` | Firebase | Score quiz |
| POST | `/api/compare` | Firebase | Compare careers |
| POST | `/api/roadmap/generate` | Firebase | Generate roadmap |
| GET | `/api/roadmap` | Firebase | Get roadmap items |
| POST | `/api/mentors/register` | Firebase | Register mentor |
| GET | `/api/mentors` | Firebase | Browse mentors |
| POST | `/api/community/posts` | Firebase | Create forum post |
| GET | `/api/employers` | Firebase | List employers |
| POST | `/api/keys` | Firebase | Create API key |
| POST | `/api/v1/careers/suggest` | API Key | Public: suggest careers |
| GET | `/api/admin/stats` | Firebase + Admin | Admin analytics |

### Example Request/Response

**Chat Endpoint** (POST `/api/chat`):

**Request**:
```json
{
  "message": "I'm interested in data science. What should I learn first?",
  "stage": "discovery",
  "is_onboarding": false
}
```

**Response**:
```json
{
  "response": "Great! Data science is a fascinating field...",
  "stage": "assessment",
  "suggestions": [
    "Tell me about your programming experience",
    "What areas of data science interest you?",
    "Have you done any projects with data?"
  ],
  "rich_component": {
    "type": "learning_roadmap",
    "data": {
      "items": [
        {
          "title": "Python for Data Science",
          "type": "course",
          "platform": "Coursera",
          "duration": "2 months",
          "cost": 49
        }
      ]
    }
  }
}
```

---

## Setup & Installation

### Prerequisites

- **Node.js**: 18+ LTS
- **Python**: 3.10+
- **Docker**: 20.10+ (for containerized deployment)
- **Git**: For cloning and version control

### Local Development

#### 1. Clone Repository

```bash
git clone https://github.com/<your-org>/careerra.git
cd careerra
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp env.example .env
# Edit .env with your credentials (GROQ_API_KEY, FIREBASE_CREDENTIALS_PATH, etc.)

# Place Firebase service account JSON
cp /path/to/firebase-service-account.json ./

# Run migrations (if any) or index careers
python -m scripts.index_careers  # Optional: pre-load semantic index

# Start backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Visit: http://localhost:8000/docs (FastAPI Swagger UI)
```

#### 3. Frontend Setup

```bash
# From repo root
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_FIREBASE_API_KEY=<your-public-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NEXT_PUBLIC_API_URL=http://localhost:8000/api
EOF

# Start development server
npm run dev
# Visit: http://localhost:3000
```

#### 4. Full Stack (Docker Compose)

```bash
# From repo root
docker compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000/api
# Nginx: http://localhost (if exposed)
```

---

## Deployment

### Production Deployment (DigitalOcean / Cloud VM)

#### 1. Server Setup

```bash
# SSH into droplet
ssh root@<your-droplet-ip>

# Run setup script (included in scripts/deploy/)
bash scripts/deploy/server-setup.sh

# This installs:
# - Docker + Docker Compose
# - Certbot for Let's Encrypt
# - Nginx
```

#### 2. Prepare Secrets

```bash
# On droplet, create /srv/careerra/ directory
mkdir -p /srv/careerra
cd /srv/careerra

# Place Firebase service account JSON
scp firebase-sa.json root@<your-droplet-ip>:/srv/careerra/

# Create .env file with production values
cat > .env << EOF
IMAGE_TAG=latest
GROQ_API_KEY=<your-groq-api-key>
PINECONE_API_KEY=<optional>
CORS_ORIGINS_STR=https://yourdomain.com
ENVIRONMENT=production
EOF
```

#### 3. Deploy via Docker Compose

```bash
# On droplet
cd /srv/careerra

# Set image tag
export IMAGE_TAG=sha-abc1234  # Usually set by GitHub Actions

# Deploy
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

#### 4. SSL Certificate (Let's Encrypt)

```bash
# Certbot auto-renews certificates; runs in a cron job or systemd timer
# Initial setup:
certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Mount certificates in nginx config:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 5. GitHub Actions CI/CD

Add `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build & Push Images
        env:
          REGISTRY: ghcr.io
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker login -u ${{ github.actor }} -p ${{ secrets.GITHUB_TOKEN }} $REGISTRY
          docker build -t $REGISTRY/${{ github.repository }}/backend:$IMAGE_TAG -f Dockerfile.backend .
          docker push $REGISTRY/${{ github.repository }}/backend:$IMAGE_TAG
          # ... repeat for frontend
      
      - name: Deploy to DigitalOcean
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          ssh -i $DEPLOY_KEY root@${{ secrets.DROPLET_IP }} \
            "cd /srv/careerra && \
             IMAGE_TAG=${{ github.sha }} docker compose pull && \
             docker compose up -d"
```

---

## Development Workflow

### Project Structure for Developers

1. **Before starting**: Check `docs/PROJECT_DOCUMENTATION.md` (this file) for overview
2. **Backend feature**: Edit `backend/app/routes/` or `backend/app/services/`
3. **Frontend feature**: Edit `components/` or `app/`
4. **Database changes**: Discuss with team; Firestore migrations are typically zero-downtime (schema-less)
5. **New LLM prompt**: Update prompt in relevant route/service file; test with backend
6. **New vector index**: Run `python -m scripts.index_careers` to re-index

### Linting & Code Quality

```bash
# Frontend
npm run lint

# Backend (no linter set up; recommend adding pylint or ruff)
# Manual code review recommended
```

### Testing Recommendations

- **Backend**: Add pytest unit tests for services (firestore_service, llm_service, wiki_service)
- **Frontend**: Add React Testing Library tests for components
- **API**: Use Postman or curl to test endpoints during development

### Git Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "Add feature X"`
3. Push: `git push origin feature/my-feature`
4. Create Pull Request on GitHub
5. Request review; merge after approval
6. GitHub Actions automatically builds and deploys to production

---

## Operational Considerations

### Backups

- **Firestore**: Enable automated backups in Google Cloud Console (daily snapshots)
- **ChromaDB**: Back up `backend/chroma_db/` directory daily
  ```bash
  tar -czf chroma_db_backup_$(date +%Y%m%d).tar.gz /srv/careerra/chroma_db/
  ```
- **Firebase Service Account**: Keep backup copy in secure location

### Monitoring & Observability

**Recommended Additions**:
1. **Error Tracking**: Sentry (Python + React SDKs)
2. **Metrics**: Prometheus (for backend) + Grafana (visualize)
3. **Logging**: CloudWatch or ELK Stack
4. **Health Checks**: Already implemented at `/api/health`; monitor regularly

**Example Sentry Setup** (backend):
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="<your-sentry-dsn>",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1
)
```

### Scaling

- **Stateless backend**: Horizontally scale by running multiple Uvicorn instances behind a load balancer
- **Firestore**: Auto-scales; monitor "hot partitions" and adjust sharding if needed
- **ChromaDB**: Consider migrating to managed Weaviate or Milvus for larger scale
- **Pinecone**: Automatically scales with your data; monitor query latency

### Security Best Practices

1. **Never commit secrets**: Use `.env` files and environment variables
2. **Rate limiting**: Already enabled; tune per your load
3. **CORS**: Restrict to your domain in production
4. **Input validation**: All routes already validate via Pydantic models
5. **HTTPS only**: Enforced in production (nginx redirects HTTP → HTTPS)
6. **Dependency updates**: Regularly run `npm audit` and `pip list --outdated`

### Cost Optimization

- **LLM calls**: Stream responses to save tokens; batch wiki updates
- **Firestore**: Use indexed queries; monitor for hot documents; consider read replicas for heavy traffic
- **Embeddings**: Cache frequently embedded texts (careers, popular queries)
- **Bandwidth**: Enable CDN for static assets (Next.js build output)

---

## Troubleshooting

### Common Issues

#### "Firestore connection failed"
- **Cause**: Service account JSON not found or invalid credentials
- **Fix**: Verify `FIREBASE_CREDENTIALS_PATH` points to valid file; re-download from Firebase Console

#### "Groq API rate limit exceeded"
- **Cause**: Too many LLM calls or requests throttled
- **Fix**: Implement exponential backoff in `llm_service`; cache responses; upgrade Groq subscription

#### "ChromaDB index empty / no results"
- **Cause**: Career index not built or stale
- **Fix**: Run `python -m scripts.index_careers` to rebuild

#### "Frontend can't reach backend"
- **Cause**: CORS issue or backend not running
- **Fix**: Check `CORS_ORIGINS_STR` in backend `.env`; verify backend is running on port 8000

#### "Firebase auth token invalid"
- **Cause**: Expired token or wrong credentials
- **Fix**: User should re-login; verify Firebase config on frontend matches backend

#### "Pinecone query returns no results"
- **Cause**: Index not loaded or metadata filter too strict
- **Fix**: Check Pinecone index exists; verify metadata keys match expected schema

#### "PDF resume parsing fails"
- **Cause**: Malformed PDF or too large (>5 MB)
- **Fix**: Recommend user re-export resume; check `MAX_PDF_SIZE_MB` setting

### Debug Commands

**Backend**:
```bash
# Check health
curl http://localhost:8000/api/health

# View Firestore data (requires gcloud CLI)
gcloud firestore documents list --collection-id=users

# Test LLM connection
python -c "from app.services import llm_service; print(llm_service.generate_text('hello'))"

# Rebuild career index
python -m scripts.index_careers
```

**Frontend**:
```bash
# Check browser console for errors (F12)
# Clear local storage: localStorage.clear()
# Check network tab for failed API calls

# Test Firebase config
npm run dev -- --verbose
```

---

## Summary & Next Steps

### What's Documented Here
✅ Project overview & purpose  
✅ System architecture (high-level diagram)  
✅ Technology stack (frontend, backend, infra)  
✅ Complete project file structure  
✅ Backend architecture (FastAPI, middleware, routes)  
✅ Frontend architecture (Next.js, components, styling)  
✅ All services & business logic  
✅ Database schema (Firestore collections)  
✅ External integrations & APIs  
✅ Environment configuration  
✅ Setup & installation instructions  
✅ Deployment (Docker Compose, GitHub Actions)  
✅ Development workflow  
✅ Operational considerations  
✅ Troubleshooting guide  

### Recommended Next Steps

1. **Onboard Team**: Share this document with developers
2. **Add Tests**: Implement unit tests for critical services
3. **Set Up Monitoring**: Integrate Sentry, Prometheus, or similar
4. **Backup Automation**: Schedule daily backups of ChromaDB and Firestore exports
5. **Documentation**: Keep this file up to date as the project evolves
6. **API Docs**: Auto-generate OpenAPI docs from backend; publish on `/docs` and in a wiki

---

**End of Document**  
*Last Updated: May 1, 2026*  
*For questions or updates, contact the development team.*
