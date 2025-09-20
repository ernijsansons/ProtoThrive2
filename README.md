# ProtoThrive Platform

ProtoThrive is a full-stack AI platform for interactive roadmap management. It combines a Next.js/Tailwind 3D/2D “Living ERP Graph” frontend with a Cloudflare Workers backend and dual-agent automation pipeline. The system emphasises cost-aware autonomy, 3D UI, and enterprise safety controls.

## Highlights
- **Living ERP Graph:** React Flow + Spline canvas with throttle-aware Zustand store and SSE/WebSocket hooks.
- **Cost-Aware Dual Agents:** The backend routes tasks through the Enterprise Coding Agent v3.4 (primary) with an optional lightweight fallback, enforcing per-request budgets and confidence thresholds.
- **JWT-secured Cloudflare Worker:** REST/GraphQL endpoints, SSE feeds, D1/KV bindings, and structured error codes (VAL-400, AUTH-401, etc.).
- **Automation & Observability:** Budget logs, agent traces, validation summaries, and governance-ready metrics for cost/quality review.

## Repository Layout
`
backend/             Cloudflare Workers (Python) backend
frontend/            Next.js frontend
enterprise-agent/    Enterprise Coding Agent v3.4 CLI and orchestration
src/core/            Lightweight orchestrator (legacy fallback agent)
src/utils/           Shared validation utilities
`

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

For more detail on the Enterprise Agent, see enterprise-agent/README.md.
