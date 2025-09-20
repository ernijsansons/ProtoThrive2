# Automation & Agents Stub

Automation components span two codebases:

- Enterprise Coding Agent v3.4 CLI (`/enterprise-agent`)
- Lightweight fallback orchestrator (`/src/core`)

This stub gives Cursor/CI workflows a stable path for the automation surface while we unify packaging. Key scripts:

```bash
# Enterprise Agent CLI
python -m enterprise_agent.agent_cli --help

# Fallback orchestrator smoke test
python ../../src/core/orchestrator.py --help
```

Budget governance artifacts live in `/enterprise-agent/LAUNCH_CHECK.md` and `/docs/agent-coordinator.md`.
