# System Map - ProtoThrive2

## System Overview
ProtoThrive is a full-stack AI-powered platform for interactive roadmap management, featuring a "Living ERP Graph" visualization and enterprise-grade agent orchestration.

## High-Level Architecture

### Core Components
1. **Frontend (Next.js/React)**
   - Location: `/frontend`
   - Tech: Next.js 13+, TypeScript, TailwindCSS
   - Deployment: Cloudflare Pages (pending build fixes)
   - Status: ⚠️ Build issues with TypeScript

2. **Backend (Cloudflare Workers Python)**
   - Location: `/backend`
   - Tech: Python 3.12, Cloudflare Workers, Hono framework
   - Deployment: https://backend-thermo.ernijs-ansons.workers.dev
   - Status: ✅ Operational

3. **AI Core (Python Orchestrator)**
   - Location: `/ai-core`
   - Tech: Python 3.12, LangChain, CrewAI, Pinecone
   - Purpose: Agent coordination and task routing

4. **Enterprise Agent (v3.4)**
   - Location: `/enterprise-agent`
   - Tech: Multi-model ensemble (GPT-5, Claude, Gemini)
   - Purpose: Advanced code generation and validation

## Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                         User Layer                          │
├─────────────────────────────────────────────────────────────┤
│                    Frontend (Next.js)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, Landing, Admin, Settings          │   │
│  │ Components: MagicCanvas, InsightsPanel, AIVision    │   │
│  │ Store: Zustand (State Management)                   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      API Gateway                            │
│              Cloudflare Workers (Python)                    │
├─────────────────────────────────────────────────────────────┤
│                    Backend Services                         │
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │  Roadmaps    │  Snippets    │   Agent Coordinator  │   │
│  │  Service     │  Service     │     Service          │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │   Cloudflare D1      │    Cloudflare KV             │   │
│  │   (SQLite)           │    (Cache)                   │   │
│  └──────────────────────┴──────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    AI Orchestration                         │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │ Enterprise Agent     │   Fallback Agent            │   │
│  │ (GPT-5 Codex)       │   (Lightweight Python)      │   │
│  └──────────────────────┴──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Model

### Production Environment
- **Frontend**: Cloudflare Pages (pending)
- **Backend**: Cloudflare Workers (Python runtime)
- **Database**: Cloudflare D1 (SQLite-based)
- **Cache**: Cloudflare KV namespace
- **CDN**: Cloudflare global network

### Staging Environment
- **Backend**: https://backend-thermo-staging.ernijs-ansons.workers.dev
- **Database**: Same D1 instance with staging namespace
- **Cache**: Separate KV namespace for staging

## Data Flow

### Request Flow
1. User → Frontend (React) → API Call
2. Frontend → Backend Worker → Auth Validation
3. Worker → Business Logic → Database Query
4. Database → Response → Worker → Frontend
5. Frontend → State Update → UI Render

### Agent Flow
1. Task Request → Agent Coordinator
2. Coordinator → Route Decision (cost/complexity)
3. Primary Agent (Enterprise v3.4) or Fallback
4. Agent → Result → Validation → Response
5. Cost/Confidence Tracking → Monitoring

## Security Architecture

### Authentication
- JWT-based authentication
- Bearer token in Authorization header
- User roles: vibe_coder, engineer, exec

### Authorization
- Role-based access control (RBAC)
- Multi-tenant data isolation
- User-scoped queries

### Security Middleware
- Input validation (Zod schemas)
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

## Key Technologies

### Frontend Stack
- Next.js 13+ (React framework)
- TypeScript (type safety)
- TailwindCSS (styling)
- React Flow (graph visualization)
- Spline (3D scenes)
- Zustand (state management)

### Backend Stack
- Python 3.12
- Cloudflare Workers (edge runtime)
- Hono (web framework)
- Zod (validation)
- JWT (authentication)

### Database & Storage
- Cloudflare D1 (SQLite)
- Cloudflare KV (key-value cache)
- 5 tables: users, roadmaps, snippets, agent_logs, insights

### AI/ML Stack
- LangChain (orchestration)
- CrewAI (agent framework)
- Pinecone (vector DB)
- GPT-5, Claude, Gemini (LLMs)

## Multi-Tenancy Model
- User-based isolation at database level
- All queries filtered by user_id
- Soft delete support for compliance
- Audit logging in agent_logs table

## Session Management
- JWT tokens with expiration
- Stateless authentication
- Token validation on every request
- Refresh token mechanism (planned)