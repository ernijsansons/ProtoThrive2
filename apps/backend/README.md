# Backend Worker Stub

The Cloudflare Worker implementation resides in `/backend`. This stub keeps the Worker visible to monorepo tooling and documents the important entry points:

- Worker entry: `/backend/src/main.py`
- Agent coordinator: `/backend/src/agent_coordinator.py`
- Shared utils: `/backend/src/utils`
- Wrangler configuration: `/backend/wrangler.toml`

Local development uses Wrangler:

```bash
cd ../../backend
npm install
wrangler dev
```

Deploy with `wrangler deploy` after secrets and bindings are configured.
