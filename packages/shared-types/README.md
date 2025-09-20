# @protothrive/shared-types

TypeScript interfaces for cross-cutting contracts:

- Agent orchestration payloads (`AgentRunRequest`, `AgentRunResult`, `AgentTraceItem`)
- Cost governance helpers (`AgentCostDetail`, `AgentBudget`)
- Roadmap CRUD payloads and summaries (`RoadmapPayload`, `RoadmapSummary`, `RoadmapQueryParams`)
- Snippet and insight DTOs shared by frontend/backends

Publish by running `npm run build` and copying `dist/` into the consuming app or by configuring a workspace dependency.
