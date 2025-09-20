# Frontend App Stub

Primary implementation lives in `/frontend`. This stub exists so tooling can treat the Next.js Living ERP Graph as a first-class app while we transition toward a unified monorepo layout. Key entry points:

- Next.js app root: `/frontend/src`
- Zustand graph store: `/frontend/src/store.ts`
- Real-time hooks: `/frontend/src/hooks`
- Deployment script: `/frontend/deploy-cloudflare.sh`

To run locally:

```bash
cd ../../frontend
npm install
npm run dev
```
