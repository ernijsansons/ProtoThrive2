# Apps Overview

This folder tracks the deployable applications that make up ProtoThrive. Each subdirectory contains high-level notes and entry points that map to the real codebases at the repository root.

- `frontend/` &rarr; wraps the Next.js Living ERP Graph located at `/frontend`.
- `backend/` &rarr; documents the Cloudflare Worker (Python) hosted in `/backend`.
- `agents/` &rarr; collects automation surface areas, including the Enterprise Agent (`/enterprise-agent`) and the lightweight fallback orchestrator (`/src/core`).

Keeping these stubs in `apps/` helps future tooling (Cursor workspaces, Nx/Turbo, CI pipelines) treat the system as a monorepo while preserving the current directory layout.
