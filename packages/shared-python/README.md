# protothrive-shared-python

Shared Pydantic models for ProtoThrive services and automation agents.

Available models:

1. Agent orchestration (`AgentRunRequest`, `AgentRunResult`, `AgentTraceItem`, cost summaries)
2. Mode/agent enums aligned with the Cloudflare Worker response contracts
3. Additional domain models can be added under `src/shared_python/models`

Install locally with `pip install -e packages/shared-python` to mirror the runtime environment.
