# 🚀 Quick Deploy Instructions

## Current Status
- ✅ **Backend API**: Live at https://backend-thermo.ernijs-ansons.workers.dev
- 🔧 **Frontend**: Ready but needs clean setup

## Fastest Way to Deploy Frontend

### Option 1: GitHub + Cloudflare Pages (Easiest)
1. Push this code to your GitHub repository
2. Go to https://dash.cloudflare.com
3. Go to Pages → Create a project
4. Connect your GitHub repository
5. Use these build settings:
   - Framework preset: Next.js
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Build output: `.next`
   - Root directory: `/frontend`
6. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://backend-thermo.ernijs-ansons.workers.dev
   NEXT_PUBLIC_SPLINE_SCENE=https://prod.spline.design/neon-cube-thermo/scene.splinecode
   ```
7. Deploy!

### Option 2: Direct Upload (If no GitHub)
1. Download the frontend folder to your local machine
2. Open terminal in frontend directory
3. Run:
   ```bash
   npm install --legacy-peer-deps
   npm run build
   npx wrangler pages deploy .next --project-name=protothrive-frontend
   ```

## What You Get

### Main App
- URL: `https://protothrive-frontend.pages.dev`
- Features:
  - Magic Canvas (2D/3D toggle)
  - Insights Panel with Thrive Score
  - Integration with backend API

### Admin Portal
- URL: `https://protothrive-frontend.pages.dev/admin-login`
- Login:
  - Email: `admin@protothrive.com`
  - Password: `ThermonuclearAdmin2025!`
- Features:
  - Add/manage API keys
  - Rotate keys
  - Delete keys
  - Future: User management, monitoring

## API Keys to Add (via Admin Portal)

Once deployed, login to admin and add:

1. **Claude** - For advanced AI tasks
2. **Kimi** - For cost-effective AI (80% of tasks)
3. **OpenAI** - Optional, for GPT models
4. **Pinecone** - For vector database
5. **Spline** - For 3D scenes (optional)

## Troubleshooting

### If build fails locally:
The monorepo has some npm issues. Best solution:
1. Copy just the `/frontend` folder to a new location
2. Run `npm install --legacy-peer-deps` there
3. Deploy from the isolated folder

### If Cloudflare Pages build fails:
Add to build command:
```
rm -rf node_modules && npm install --legacy-peer-deps && npm run build
```

## Architecture Summary

```
Your Browser → Cloudflare Pages (Frontend)
                      ↓
              Cloudflare Workers (Backend API)
                      ↓
              Cloudflare D1 + KV (Data)
```

Everything runs on Cloudflare's edge network for maximum speed!

---

**Need the code?** The frontend folder has everything you need. Just deploy it!