# ProtoThrive System Architecture

## High-Level Overview
- **Living ERP Graph Frontend (Next.js + React Flow + Spline):** A Next.js 14 application renders the interactive roadmap graph, combining 2D React Flow nodes with embedded Spline scenes for 3D context. Zustand manages graph state and integrates server-sent events (SSE) and WebSocket streams for real-time updates. Tailwind CSS and custom shaders drive UI theming.
- **Cloudflare Worker Backend (Python):** A Python Cloudflare Worker exposes REST and GraphQL endpoints, streams updates via SSE/WebSockets, and hosts the agent coordination API. It trusts D1 (SQLite) and KV bindings for persistence, and implements structured error codes (`AUTH-*`, `VAL-*`, `COST-*`).
- **Dual-Agent Automation Layer:** The Enterprise Coding Agent v3.4 (primary) runs out-of-process via HTTP, while a lightweight Python fallback agent lives in `src/core`. The AgentCoordinator enforces confidence and cost constraints, emits decision traces, and manages retries/fallbacks.
- **Shared Validation & Security Utilities:** Common auth, validation, and security routines reside in `src/utils` and are imported by both Worker endpoints and agents. Governance metrics and budget logs feed dashboards.
- **Observability & Governance:** Cost tracking, execution traces, and validation summaries feed audit logs. Budget policies, launch checklists, and smoke tests live under `enterprise-agent/`.

## Component Responsibilities
### Frontend (`frontend/`)
- Next.js app with `app`/`pages` hybrid routing for marketing vs. authenticated surfaces.
- Zustand store (`src/store.ts`) tracks graph nodes, edges, and agent results; debounced actions ensure rate limits.
- Hooks under `src/hooks/` subscribe to SSE and WebSocket endpoints provided by the Worker.
- `src/components/graph/` renders React Flow nodes, overlays 3D Spline scenes, and reflects agent feedback (confidence, cost badges).

### Backend Worker (`backend/`)
- Entry point `src/main.py` dispatches REST routes (`/api/roadmaps`, `/api/agent/run`, `/health`).
- `agent_coordinator.py` orchestrates Enterprise and fallback agents, applying budgets (`AGENT_BUDGET_*`) and confidence thresholds.
- Utility layer (`src/utils/`) handles response formatting, schema validation, auth scopes, and Cloudflare bindings.
- `wrangler.toml` configures bindings: D1 for persistence, KV for caching, Service Bindings for Enterprise Agent, R2 for asset storage.

### Automation & Agents
- `enterprise-agent/` contains the v3.4 agent CLI with Playwright smoke tests, benchmark harness, and launch guardrails (`LAUNCH_CHECK.md`).
- `src/core/` holds the lightweight fallback orchestrator with Retrieval-Augmented Generation (RAG) helpers and a simple router.
- Budget logs and validation outputs flow back to the Worker for persistence and governance.

### Shared Assets
- `docs/` captures coordinator design and (this document) the architecture blueprint.
- `scripts/` and `automation/` provide CI/CD helpers, lint/test wrappers, and deployment automation.

## Runtime Data Flow
1. User interacts with the Living ERP Graph; the frontend requests data (`GET /api/roadmaps`) and subscribes to SSE/WebSocket channels for updates.
2. When automation is triggered (`POST /api/agent/run` or roadmap creation with `generate_plan=true`), the Worker validates budgets and modes, then delegates to AgentCoordinator.
3. AgentCoordinator calls the Enterprise Agent (service binding) with context payloads. If confidence < threshold or budget policies demand, it invokes the fallback agent (`src/core/orchestrator.py`).
4. Results (output text, structured plan, cost metrics) persist to D1/KV and emit SSE/WebSocket updates. The frontend updates the graph, highlighting agent actions.
5. Observability data (cost_actual, fallback_used, validation results) are logged to Cloudflare dashboards and archived for governance reviews.

## Deployment Topology
- **Frontend:** Deployed via Cloudflare Pages (or Vercel alternative), using environment variables in `.env.local` for local dev.
- **Backend Worker:** Deployed with Wrangler to Cloudflare Workers, binding D1, KV, R2, and enterprise agent service endpoints.
- **Enterprise Agent:** Runs as a separate Python service/container with CLI orchestrator, optionally reachable via Cloudflare Worker service binding.
- **Infrastructure as Code:** Scripts under `protothrive-deploy/` and `automation/` manage environment provisioning, secret injection, and smoke tests.

## Security & Compliance Considerations
- JWT-based auth and scope checks in Worker endpoints.
- Budget guardrails and validation checks enforced before returning agent output.
- Security scanning tooling (`frontend/src/services/security-*.ts`, `security/` directory) supports enterprise governance.
- Launch checklist ensures cost and validation thresholds prior to production pushes.
