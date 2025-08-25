# THERMONUCLEAR_ROADMAP.md: Ultimate Execution Blueprint for ProtoThrive

## Document Metadata & Global Instructions
- **Version**: 1.0.0 (Thermonuclear Release - August 23, 2025)
- **Purpose**: This single file is the absolute SSoT (Single Source of Truth) for building ProtoThrive, an AI-first SaaS platform that empowers users to prototype and thrive in software development. It unifies fragmented tools into a visual "mission control" dashboard with the "Living ERP Graph"—a dynamic, 3D-visualized roadmap evolving from skeletal plans to production-ready apps via multi-agent AI automation.
- **Global System Prompt for Claude Code (Apply to EVERY Terminal)**:
  ```
  You are a Fortune-50 Staff+ Engineer building ProtoThrive. This file is your bible—follow EVERY detail with 0 vagueness, 0 hallucinations, 0 errors. Use exact specs from sections below. Structure: Read full file first. Execute only your assigned phase/terminal. Output deterministic, production-grade code: TypeScript/JS for frontend/backend, Python for AI, SQL for DB, JSON for workflows. Validate EVERY step: Lint (ESLint/ pylint), test (Jest/pytest, >95% coverage), schema check (Zod), error handling (custom codes e.g., ERR-400-VAL). No assumptions—use dummies/mocks for unfinished parts. Include Mermaid diagrams, logs (console.log at milestones), checkpoints (e.g., "Phase X Complete - Validation Passed"). If ANY ambiguity, output "ESCALATE: [detail]" and stop. Goal: Code so perfect it deploys flawlessly on Cloudflare/Framer/Vercel. Thrive vibe: Make UIs "out of this world" with neon/3D—use uxpilot.ai mocks where specified.
  ```
- **Project Context (Read & Internalize)**:
  - **Vision**: Democratize dev—vibe coders build visually without code; teams unify workflows; execs gain insights. Bridge 70% prototype gap with agents guaranteeing success.
  - **Users/Roles**: Vibe Coder (visuals only), Engineer (full access), Exec (insights read-only).
  - **Tech Stack**: Next.js/Tailwind/React Flow/Spline (frontend), Cloudflare Workers/D1/KV (backend), LangChain/CrewAI/Pinecone (AI), n8n (workflows), Vercel/Netlify (deploys), Clerk (auth), Stripe (billing), uxpilot.ai (UI gen), Kimi/Claude (LLMs).
  - **Secret Sauce**: 3D Cosmic Roadmap (neon cubes like user image), 50+ templates, Thrive Score (formula: completion*0.6 + UI_polish*0.3 + risk*0.1), 80% autonomous agents with HITL.
  - **Constraints**: Metadata-only (no full code); multi-tenant (user_id isolation); budget <$0.10/task; compliance (GDPR soft deletes).
  - **Non-Overlapping**: Each terminal/phase independent—use mocks/dummies for cross-deps (e.g., Terminal 1 DB mocked in Terminal 3).
- **Execution Rules for Claude Code**:
  - Run in separate terminals as labeled (e.g., Terminal 1: Phase 1).
  - Start with: "Initializing Phase X - Confirming Specs" + full file parse log.
  - Output: Folder structure, files with exact code, validations (run tests/lint), diagrams (Mermaid in comments).
  - Error-Free: 100% syntactically valid; handle ALL edges (e.g., invalid UUID → 400 err).
  - Deterministic: Fix seeds (random.seed(42)); no external calls—use mocks (e.g., fetch → console.log).
  - Validation: After each step, "Checkpoint: [Test] Passed - [Detail]".
  - End with: "Phase X Complete - Ready for Integration. No Hallucinations Detected."

## Global Configs & Mocks (Apply to All Terminals)
- **.env Template** (Copy to each terminal root):
  ```
  CLAUDE_API_KEY=mock_claude_key
  KIMI_API_KEY=mock_kimi_key
  UX_PILOT_KEY=mock_uxpilot_key
  CLOUDFLARE_ACCOUNT_ID=mock_cf_id
  D1_DB_ID=mock_d1_id
  KV_ID=mock_kv_id
  PINECONE_KEY=mock_pinecone
  VERCEL_TOKEN=mock_vercel
  CLERK_SECRET=mock_clerk
  STRIPE_KEY=mock_stripe
  N8N_WEBHOOK_SECRET=mock_n8n
  ```
- **Mock Functions (Include in utils/mocks.ts or py)**:
  - JS: `export const mockFetch = (url, opts) => { console.log(`Mock Fetch: ${url}`); return {json: () => ({success: true})}; };`
  - Python: `def mock_api_call(endpoint, payload): print(f"Mock Call: {endpoint}"); return {"success": True}`
  - Use for ALL external (e.g., replace fetch with mockFetch).

- **Dummy Data**:
  - User: {id: 'uuid1', role: 'vibe_coder', email: 'test@proto.com'}
  - Roadmap: {id: 'rm1', json_graph: '{"nodes":[{"id":"n1","label":"Start","status":"gray"}],"edges":[{"from":"n1","to":"n2"}]}', thrive_score: 0.45}
  - Snippet: {id: 'sn1', category: 'ui', code: 'console.log("Dummy UI");', ui_preview_url: 'mock_url.png'}

- **Global Validation Script** (Run at End of Each Phase):
  - JS: `npm run lint && npm test && echo "Validation Passed - No Errors"`
  - Python: `pylint src/*.py && pytest && print("Validation Passed")`

## Terminal 1: Phase 1 - Backend Architecture & Data Foundation
Objective: Build core backend with Workers APIs, D1 schema/queries for users/roadmaps, multi-tenant logic, dummy endpoints for graph ops—foundation for all data interactions.
Scope (Do NOT do): No frontend, AI, workflows, deploys, or monitoring; mocks only for external.
Step-by-Step Execution:
1. Create 'backend' dir; npm init -y; npm i hono @cloudflare/workers-types zod; setup tsconfig.json for ES modules.
2. In src/index.ts, implement Hono app with auth middleware (mock JWT validate returns 'uuid1'), GET /roadmaps/:id (query D1 mock), POST /roadmaps (insert mock).
3. In utils/db.ts, mock D1 with functions (queryRoadmap returns dummy graph, insertRoadmap logs/returns id).
4. Add Zod validation: For POST body, z.object({userId: z.string().uuid(), json_graph: z.string().min(10)}).
5. Config workers.toml with d1_bindings and kv_bindings mocks.
6. Include Mermaid ERD in comments.
Validation/Checkpoints: npm run dev; curl GET /roadmaps/rm1 (expect dummy JSON, 403 if no auth); curl POST with invalid body (400); zod.safeParse on body (log errors); echo "Phase 1 Checkpoint: APIs responsive, mocks working."
Expected Output: backend/src/index.ts (Hono app), backend/utils/db.ts (mocks), backend/workers.toml (config), backend/package.json (deps); dummy responses verifiable via curl.

## Terminal 2: Phase 2 - Frontend Skeleton & Visual Canvas
Objective: Setup Next.js frontend with Zustand state, Magic Canvas (2D React Flow, 3D Spline), dashboard layout, dummy nodes/edges for roadmap visuals—UI foundation.
Scope (Do NOT do): No backend calls, AI, workflows, deploys, or security; static dummies only.
Step-by-Step Execution:
1. npx create-next-app@latest frontend --ts; cd frontend; npm i reactflow @splinetool/react-spline zustand tailwindcss postcss autoprefixer; npx tailwindcss init -p.
2. In src/store.ts, create Zustand with dummy nodes/edges, loadGraph/toggleMode actions as specified.
3. In src/components/MagicCanvas.tsx, implement with ReactFlow for 2D (use dummy data), Spline for 3D (mock scene URL, log mode).
4. In src/pages/index.tsx, build DashboardComponent with env load, fetchGraph mock (returns dummy), InsightsPanel stub (shows score bar).
5. Add Tailwind classes for responsive (e.g., grid-cols-1 md:grid-cols-2).
6. Include Mermaid component flow in comments.
Validation/Checkpoints: npm run dev; browser check: Toggle mode logs/changes view (no errors); ReactFlow shows 3 nodes/2 edges; lint/test pass (add basic Jest: test('renders canvas', () => expect(true).toBe(true))).
Expected Output: frontend/src/store.ts (Zustand), frontend/src/components/MagicCanvas.tsx, frontend/src/pages/index.tsx (dashboard), frontend/tailwind.config.js; verifiable by localhost:3000 load without crashes.

## Terminal 3: Phase 3 - AI Core & Agent Orchestration
Objective: Python-based AI foundation with LangChain router, RAG (Pinecone mocks), CrewAI agent skeletons (Planner/Coder/Auditor), KV cache policies—AI prep for modules.
Scope (Do NOT do): No frontend, backend, workflows, deploys, or monitoring; mocks for APIs/DB.
Step-by-Step Execution:
1. mkdir ai-core; cd ai-core; poetry init; poetry add langchain crewai pinecone-client; touch .env (with mock keys).
2. In src/router.py, class PromptRouter with route_task (logic as specified, print outputs).
3. In src/rag.py, mock upsert_snippet (print), query_snippet (return dummy match >0.9).
4. In src/agents.py, classes PlannerAgent (decompose returns 3 dummy tasks), CoderAgent (code returns mock code), AuditorAgent (audit returns True).
5. Add cache in src/cache.py: Class with get/set (dict mock, TTL via time check).
6. Include Mermaid for agents in comments.
Validation/Checkpoints: poetry run python src/router.py (test with {'type':'code','complexity':'low'} expect 'kimi'); run agents decompose/code/audit (print outputs match dummies); rag query (returns mock snippet); cache set/get (expires after sim sleep); pylint pass >9/10.
Expected Output: ai-core/src/router.py, ai-core/src/rag.py, ai-core/src/agents.py, ai-core/src/cache.py, ai-core/poetry.lock (deps); outputs verifiable by script runs.

## Terminal 4: Phase 4 - Automation Workflows & CI/CD
Objective: n8n JSON workflows for agent triggers, GitHub Actions yml for CI/CD, deploy trigger scripts to Vercel mocks, progress update logic—automation base.
Scope (Do NOT do): No frontend, AI, backend data, or monitoring; mocks for calls.
Step-by-Step Execution:
1. mkdir automation; cd automation; npm init -y (for JS scripts); install n8n locally but export JSON.
2. In workflows/automation.json, define n8n as specified (nodes with mockOutputs, print logs).
3. In .github/workflows/ci-cd.yml, full pipeline as specified (jobs: lint/test/build/deploy with npm placeholders).
4. In scripts/deploy_trigger.js, function with mock fetch to Vercel (console.log deploy).
5. In scripts/progress.js, calcProgress function as specified (with dummy call).
6. Include Mermaid for n8n in JSON comments.
Validation/Checkpoints: n8n import automation.json (run manually, expect mocks print); git push test ci-cd (Actions log pass); node scripts/deploy_trigger.js (log success); node progress.js (output 100 for 3/3); yamllint ci-cd.yml (valid).
Expected Output: automation/workflows/automation.json (n8n), automation/.github/workflows/ci-cd.yml, automation/scripts/deploy_trigger.js, automation/scripts/progress.js; verifiable by manual runs.

## Terminal 5: Phase 5 - Security, Secrets, & Monitoring Foundation
Objective: JS classes for secrets (Vault mock), monitoring logs/metrics, error handler middleware, cost check functions, GDPR delete hooks—security/ops base.
Scope (Do NOT do): No frontend, AI, backend APIs, or workflows; mocks for vendors.
Step-by-Step Execution:
1. mkdir security; cd security; npm init -y.
2. In src/vault.js, class Vault with getSecret (mock return).
3. In src/monitor.js, logMetric function (console.log).
4. In src/error.js, GlobalErrorHandler with handle (return code).
5. In src/cost.js, checkBudget function (throw on exceed).
6. In src/compliance.js, deleteUser function (log queue).
7. Include Mermaid for error flow in comments.
Validation/Checkpoints: node src/vault.js (returns mock); node src/monitor.js (logs metric); throw/test error.js (returns code); cost.js throw on >10000; compliance.js logs delete; eslint src/*.js (pass).
Expected Output: security/src/vault.js, security/src/monitor.js, security/src/error.js, security/src/cost.js, security/src/compliance.js; verifiable by node runs.

## Integration & Deployment Guidelines
- **Phase Integration**: After all 5 phases complete, create integration/ directory with main.js that imports/connects all modules.
- **Testing Strategy**: Each phase must include unit tests (>95% coverage); integration tests post-phase completion.
- **Documentation**: Auto-generate API docs from Zod schemas; include Mermaid architecture diagrams in each phase.
- **Monitoring**: Log all checkpoints to shared monitoring.log file; track metrics (response time, error rate, cost per task).
- **Rollback Strategy**: Git tags for each phase; ability to rollback to any stable checkpoint.

## Success Metrics & KPIs
- **Technical**: 0 lint errors, >95% test coverage, <200ms API response time, <$0.10 per task cost.
- **User Experience**: <3s dashboard load time, >90% roadmap visualization success rate, intuitive 3D navigation.
- **Business**: User adoption (target 1000 beta users), revenue ($10k MRR within 6 months), market penetration.

## Risk Mitigation
- **Technical Risks**: Mock external dependencies to prevent failures; comprehensive error handling; fallback UI states.
- **Security Risks**: Multi-tenant isolation; no hardcoded secrets; GDPR compliance hooks; audit logging.
- **Business Risks**: MVP first (core features only); user feedback loops; cost monitoring; competitive analysis.

---
**THERMONUCLEAR DIRECTIVE**: This document is the ultimate authority. Any deviation requires explicit approval. Claude Code must execute with precision, validation, and the thriving spirit that defines ProtoThrive. Let's build the future of software development—together, we thrive! 🚀