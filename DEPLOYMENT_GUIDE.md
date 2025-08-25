# 🚀 ProtoThrive Deployment Guide

## Current Status

### ✅ Backend API
- **URL**: https://backend-thermo.ernijs-ansons.workers.dev
- **Status**: Deployed and operational
- **Endpoints**: 
  - `/` - Health check
  - `/api/roadmaps` - Roadmap management
  - `/api/snippets` - Code snippets
  - `/api/admin/keys` - API key management (super admin only)
  - `/graphql` - GraphQL endpoint

### 🔧 Frontend Application
- **Status**: Ready for deployment
- **Features Added**:
  - Super Admin Portal at `/admin`
  - API Keys Management UI
  - Admin Login at `/admin-login`
  - Main Dashboard with Magic Canvas

## Super Admin Access

### Login Credentials (for testing)
- **URL**: `/admin-login`
- **Email**: `admin@protothrive.com`
- **Password**: `ThermonuclearAdmin2025!`

### Admin Features
1. **API Keys Management**
   - Add new API keys for services (Claude, Kimi, OpenAI, etc.)
   - Rotate existing keys
   - Delete unused keys
   - Keys are securely stored in Cloudflare KV

2. **Future Admin Features** (UI prepared)
   - User Management
   - System Monitoring
   - Settings Configuration

## Deployment Instructions

### Option 1: Local Development
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
# Access at http://localhost:3000
```

### Option 2: Deploy to Cloudflare Pages (Recommended)
```bash
cd frontend
npx wrangler pages deploy .next --project-name=protothrive-frontend
```

Or via GitHub integration:
1. Push code to GitHub
2. Go to Cloudflare Pages dashboard
3. Create new project from GitHub
4. Build settings:
   - Build command: `npm run build`
   - Build output: `.next`
   - Environment variables: Add from `.env.local`

## API Integration

The frontend is configured to use the live backend at:
`https://backend-thermo.ernijs-ansons.workers.dev`

All API calls will work once the frontend is deployed.

## Environment Variables

The following are already configured in `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SPLINE_SCENE` - 3D scene URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│  Frontend       │────▶│  Backend API     │────▶│  Cloudflare     │
│  (Next.js)      │     │  (Hono/Workers)  │     │  D1 + KV        │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│  Admin Portal   │     │  GraphQL API     │
│  - API Keys     │     │  - Queries       │
│  - User Mgmt    │     │  - Mutations     │
└─────────────────┘     └──────────────────┘
```

## Next Steps

1. **Deploy Frontend**: Choose one of the deployment options above
2. **Add Real API Keys**: Login to admin portal and add your actual API keys
3. **Test Integration**: Verify frontend can communicate with backend
4. **Monitor**: Check Cloudflare dashboard for API usage

## Troubleshooting

### Frontend won't build
- Run `npm install --legacy-peer-deps` to handle peer dependency conflicts
- Check Node.js version (requires v18+)

### API calls failing
- Verify backend is accessible: https://backend-thermo.ernijs-ansons.workers.dev
- Check browser console for CORS errors
- Ensure authentication token is being sent

### Admin login not working
- Use the exact credentials provided above
- Check localStorage for `adminToken` after login
- Verify backend admin endpoints are deployed

## Security Notes

1. **Change default admin password** immediately after first deployment
2. **API keys are encrypted** in Cloudflare KV storage
3. **All admin endpoints** require super_admin role authentication
4. **CORS is configured** to accept requests from your domain

---

**Thermonuclear Status**: Platform Ready for Launch 🚀