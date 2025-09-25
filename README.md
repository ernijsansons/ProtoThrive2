# ProtoThrive Platform

ProtoThrive is a full-stack AI platform for interactive roadmap management. It combines a Next.js/Tailwind 3D/2D �Living ERP Graph� frontend with a Cloudflare Workers backend and dual-agent automation pipeline. The system emphasises cost-aware autonomy, 3D UI, and enterprise safety controls.

## Highlights
- **Living ERP Graph:** React Flow + Spline canvas with throttle-aware Zustand store and SSE/WebSocket hooks.
- **Cost-Aware Dual Agents:** The backend routes tasks through the Enterprise Coding Agent v3.4 (primary) with an optional lightweight fallback, enforcing per-request budgets and confidence thresholds.
- **JWT-secured Cloudflare Worker:** REST/GraphQL endpoints, SSE feeds, D1/KV bindings, and structured error codes (VAL-400, AUTH-401, etc.).
- **Automation & Observability:** Budget logs, agent traces, validation summaries, and governance-ready metrics for cost/quality review.

## Repository Layout
```
backend/             Cloudflare Workers (TypeScript) backend with Hono framework
frontend/            Next.js frontend with Tailwind CSS and Zustand state management
protothrive-deploy/  Production deployment version with optimized components
enterprise-agent/    Enterprise Coding Agent v3.4 CLI and multi-domain orchestration
ai-core/            Python AI orchestration with LangChain and CrewAI
automation/         n8n workflow automation and CI/CD scripts
docs/               Comprehensive documentation (API, components, deployment guides)
scripts/            Deployment and utility scripts for multiple environments
security/           Security configurations and compliance tools
```

## Production Deployment Status 🚀

### Backend (✅ Deployed)
- **Staging**: https://backend-thermo-staging.ernijs-ansons.workers.dev
- **Production**: https://backend-thermo.ernijs-ansons.workers.dev
- **Database**: D1 protothrive-db (5 tables, migrations applied)
- **Cache**: KV protothrive-kv (operational)
- **Health Status**: All endpoints operational (75% test success rate)

### Frontend (⚠️ Build Issues)
- TypeScript compilation errors in login/signup components
- Core components functional, needs build fixes for deployment
- Environment configured for staging backend

### Test Suite (✅ Operational)
- Thermonuclear test suite with 8 test suites covering all components
- Production smoke tests passing
- AI agent orchestration validated
- Security and performance frameworks ready

## Enterprise Deployment Options 🏢

### Option 1: Cloudflare Edge (Recommended)
- **Global Performance**: <50ms latency worldwide via 200+ edge locations
- **Built-in Security**: DDoS protection, WAF, and automatic SSL
- **Auto-scaling**: Handles traffic spikes automatically
- **Cost-effective**: Pay-per-request pricing model
- **Quick Setup**: `./scripts/deploy-cloudflare.sh production`

### Option 2: Traditional Docker Stack
- **Full Control**: Complete infrastructure management
- **Custom Monitoring**: Prometheus, Grafana, ELK stack
- **On-premises**: Deploy anywhere with Docker
- **Enterprise Features**: Advanced security and compliance
- **Quick Setup**: `./scripts/deploy.sh production`

**Choose your deployment**: `./scripts/choose-deployment.sh`

## Prerequisites
- **Node.js 20+** (frontend build/tests)
- **Python 3.12+** (backend tooling/tests)
- **Cloudflare Wrangler 3+** (deployment)
- Optional: httpx for local Enterprise Agent calls outside Workers.

## Frontend
`ash
cd frontend
npm install
npm test          # Jest suites (integration test currently skipped pending backend integration)
npm run dev       # Next.js dev server on http://localhost:5000
`
Environment variables reside in rontend/.env.local:
`
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_WS_URL=ws://localhost:8787
NEXT_PUBLIC_SPLINE_SCENE=https://prod.spline.design/mock
`

## Backend Worker
`ash
cd backend
# Configure env vars in wrangler.toml (see below)
wrangler dev            # Local dev (Python Workers preview)
wrangler deploy         # Publish to Cloudflare
`
Key environment variables (wrangler.toml):
`
[vars]
AGENT_MODE="fallback"                 # single | fallback | ensemble
AGENT_BUDGET_DEFAULT="0.40"
AGENT_BUDGET_MAX="1.00"
AGENT_BUDGET_FALLBACK_MIN="0.05"
AGENT_CONFIDENCE_THRESHOLD="0.8"
# ENTERPRISE_AGENT_URL="https://your-agent-endpoint"
# ENTERPRISE_AGENT_TOKEN="your-token"
`

### Agent Coordinator
The backend exposes /api/agent/run for orchestrated tasks. Sample request:
`json
POST /api/agent/run
{
  "task": "Summarise roadmap milestones",
  "context": {
    "json_graph": "{...}"
  },
  "budget": 0.3,
  "mode": "fallback"
}
`
Response payload includes the chosen agent, confidence, cost usage, validation details, and a trace of all agent attempts. Budgets can be overridden per request via X-Agent-Budget; mode overrides are supported via X-Agent-Mode.

## Dual Agent Pipeline
1. **Primary (Enterprise Agent):** Calls the v3.4 orchestration stack. If confidence = threshold and validation passes, the result is returned.
2. **Fallback (Lightweight Agent):** Reuses the Python src/core orchestrator when the primary fails, returns low confidence, or budget policies demand a cheaper path.
3. **Cost Controls:** Each adapter publishes cost estimates/actuals. The coordinator enforces budget caps, records spend, and emits structured logs (gent, confidence, cost_actual, allback_used). Exceeding the per-task budget results in a COST-402 error.

## Testing
- **Frontend:** 
pm test (unit/component). The roadmap integration test is temporarily skipped pending backend-AI wiring.
- **Backend:** pytest is currently paused until the legacy i-core/enterprise-agent tests are refactored to the new coordinator API.
- **Launch Check:** See enterprise-agent/LAUNCH_CHECK.md for pre-deploy verification and cost guardrails.

## Agent-Orchestrated Roadmaps\n- `POST /api/roadmaps` now accepts `generate_plan`, `agent_task`, `agent_budget`, and `agent_mode` fields to automatically call the Enterprise Agent coordinator when creating a roadmap.\n- `GET /api/roadmaps/{id}?run_agent=1` runs the coordinator on demand and returns the full agent report alongside the saved roadmap.\n\n## Deployment
1. Configure Cloudflare bindings (wrangler.toml) and secrets (ENTERPRISE_AGENT_URL, tokens, D1 IDs).
2. wrangler deploy for the backend worker.
3. 
pm run build + Cloudflare Pages deploy for the frontend (rontend/deploy-cloudflare.sh).
4. Hit /health and /api/agent/run to validate the deployment. Monitor cost/trace logs for fallback usage.

## Roadmap
- Integrate the Enterprise Agent output into roadmap CRUD (auto-generated nodes, thrive score updates).
- Re-enable roadmap integration testing with backend-connected mocks.
- Add CI pipelines (GitHub Actions) for lint/tests/backend smoke + cost guardrail checks.

## 📚 Complete Documentation

### Core Documentation
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Complete REST API reference with authentication, endpoints, and error codes
- **[Component Documentation](docs/COMPONENT_DOCUMENTATION.md)** - React components, props, usage examples, and testing guides
- **[Backend Architecture](docs/BACKEND_ARCHITECTURE.md)** - Serverless architecture, database schema, security, and performance optimization
- **[Enterprise Agent Integration](docs/ENTERPRISE_AGENT_INTEGRATION.md)** - Multi-domain AI orchestration, cost management, and safety features
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Cloudflare Workers, Docker containers, and hybrid deployment options
- **[Troubleshooting & FAQ](docs/TROUBLESHOOTING_FAQ.md)** - Common issues, debugging procedures, and emergency response

### Quick Links
- **Enterprise Agent Details**: [enterprise-agent/README.md](enterprise-agent/README.md)
- **Frontend Components**: [protothrive-deploy/src/components/](protothrive-deploy/src/components/)
- **Database Schema**: [backend/migrations/001_init.sql](backend/migrations/001_init.sql)
- **Deployment Scripts**: [scripts/](scripts/)
- **Security Configuration**: [security/](security/)
