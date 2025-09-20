# Shared Packages

The `packages/` workspace will house cross-cutting code that can be consumed by the frontend, backend, and agents. Two starter packages are provided:

- `shared-types/` for TypeScript definitions (API contracts, graph schemas).
- `shared-python/` for Python utilities (validation helpers mirrored from `src/utils`).

Add additional packages here (e.g., analytics, governance) and wire them into tooling via workspace manifests.
