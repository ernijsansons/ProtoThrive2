# Agent Coordinator Design

## Overview
The backend Worker exposes a cost-aware agent coordination layer that runs the Enterprise Coding Agent (primary) and a lightweight Python fallback agent. The coordinator enforces per-request budgets, confidence thresholds, and returns a full decision trace.

## Execution Modes
- single: only the Enterprise Agent runs. Fallback is disabled.
- allback: run the Enterprise Agent first; if validation fails or confidence < threshold, attempt the lightweight agent (if budget permits).
- ensemble: run both agents sequentially and keep the higher-confidence result.

Mode can be set globally via AGENT_MODE or overridden per request with X-Agent-Mode or the JSON body mode field.

## Budget Controls
Environment variables (defaults in ackend/wrangler.toml):
- AGENT_BUDGET_DEFAULT – default per-task budget (USD).
- AGENT_BUDGET_MAX – hard ceiling regardless of overrides.
- AGENT_BUDGET_FALLBACK_MIN – minimum budget required to attempt the fallback agent.
- AGENT_CONFIDENCE_THRESHOLD – confidence level that determines whether fallback is required in fallback mode.

Requests can override budgets using the udget property or X-Agent-Budget header. Invalid overrides trigger a VAL-400 response.

## API Endpoint
`
POST /api/agent/run
{
  "task": "Generate next sprint plan",
  "context": { "json_graph": "{ ... }" },
  "budget": 0.35,
  "mode": "fallback"
}
`

Response example:
`
{
  "agent": "enterprise",
  "mode": "fallback",
  "confidence": 0.86,
  "cost": {
    "estimate": 0.12,
    "actual": 0.11,
    "consumed": 0.11,
    "remaining": 0.24
  },
  "output": { ... },
  "validation": { ... },
  "fallback_used": false,
  "trace": [
    { "agent": "enterprise", "success": true, "confidence": 0.86, "cost": 0.11, "error": null }
  ]
}
`

If the budget is exceeded or no agent succeeds, the coordinator returns a structured error (for example {"error": "Budget exhausted", "code": "COST-400"}) and no further agents are executed.

## Logging & Observability
- Each agent invocation logs to stdout (captured by Cloudflare).
- The response 	race includes cost/confidence for every attempt.
- Extend governance dashboards to track cost_actual, allback_used, and agent confidence over time.

## Testing Guidance
- Unit tests should mock AgentCoordinator with predefined adapter outputs.
- Integration tests can hit /api/agent/run with different budgets and verify fallback behaviour.
- For local runs without Cloudflare etch, install httpx or mock _http_post to simulate Enterprise Agent responses.

## Future Enhancements
- Persist historical cost/confidence metrics in D1 and adapt routing thresholds based on agent performance.
- Add agent-specific suppression lists (e.g. tasks that always exceed cost on the fallback agent).
- Implement a retry queue and human-in-the-loop approval flow when both agents fail.