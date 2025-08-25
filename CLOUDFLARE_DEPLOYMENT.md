# ☁️ ProtoThrive Cloudflare Deployment Guide

## Why Cloudflare Everything?

Since our backend is already on Cloudflare Workers, using Cloudflare Pages for the frontend gives us:
- 🚀 Edge deployment globally
- 🔒 Same security context
- ⚡ Fastest backend-frontend communication
- 💰 Single billing (more cost-effective)
- 🛠️ Unified dashboard for monitoring

## Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Ecosystem                      │
├─────────────────────────┬───────────────────────────────────┤
│   Cloudflare Pages      │      Cloudflare Workers          │
│   (Frontend)            │      (Backend API)               │
│                         │                                   │
│ • Next.js App          │  • Hono REST API                 │
│ • Admin Portal         │  • GraphQL Endpoint              │
│ • Magic Canvas UI      │  • API Key Management            │
│                         │                                   │
└─────────────────────────┴───────────────────────────────────┘
                    │                    │
                    ▼                    ▼
         ┌──────────────────┐   ┌──────────────────┐
         │  Cloudflare D1    │   │  Cloudflare KV    │
         │  (Database)       │   │  (Key Storage)    │
         └──────────────────┘   └──────────────────┘
```

## Quick Deploy (2 minutes)

```bash
cd frontend
./deploy-cloudflare.sh
```

## Manual Deploy Steps

### 1. Build Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run build
```

### 2. Deploy to Cloudflare Pages
```bash
npx wrangler pages deploy .next \
  --project-name=protothrive-frontend \
  --branch=main
```

### 3. Set Custom Domain (Optional)
In Cloudflare Dashboard:
1. Go to Pages > protothrive-frontend
2. Custom domains > Set up custom domain
3. Add your domain (e.g., app.protothrive.com)

## API Keys You'll Need

Login to the admin portal and add these keys:

| Service | Used For | Required |
|---------|----------|----------|
| Claude | Advanced AI tasks | Yes |
| Kimi | Cost-effective AI | Yes |
| OpenAI | GPT models (optional) | No |
| Pinecone | Vector search | Yes |
| Clerk | Authentication | No* |
| Stripe | Payments | No* |
| N8N | Automation | No |
| Spline | 3D scenes | No |

*Not required for MVP

## Environment Variables

Already configured in `.env.local`:
- ✅ `NEXT_PUBLIC_API_URL` → Points to Workers API
- ✅ `NEXT_PUBLIC_SPLINE_SCENE` → 3D scene URL
- ✅ `NEXT_PUBLIC_WS_URL` → WebSocket endpoint

## Post-Deployment Checklist

- [ ] Visit https://protothrive-frontend.pages.dev
- [ ] Login to admin at /admin-login
- [ ] Add Claude API key
- [ ] Add Kimi API key
- [ ] Test roadmap creation
- [ ] Verify 3D/2D toggle works
- [ ] Check API calls in Network tab

## Monitoring

View all metrics in one place:
1. Go to Cloudflare Dashboard
2. Analytics > Pages (for frontend)
3. Analytics > Workers (for backend)
4. Logs > Real-time logs

## Cost Optimization

With everything on Cloudflare:
- **Workers**: First 100k requests/day free
- **Pages**: Unlimited requests
- **D1**: 5GB free
- **KV**: 100k reads/day free

Estimated monthly cost for moderate usage: **$0-5**

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### API Connection Issues
Check CORS in backend:
- Should allow your Pages domain
- Already configured for *.pages.dev

### Admin Login Issues
- Clear localStorage
- Use exact credentials
- Check browser console

## Security Notes

1. **Immediately after deploy**:
   - Change admin password
   - Add your real API keys
   - Remove test credentials

2. **API Keys are secure**:
   - Stored encrypted in KV
   - Never exposed to frontend
   - Masked in UI display

## Support

- Backend API: https://backend-thermo.ernijs-ansons.workers.dev
- Frontend: https://protothrive-frontend.pages.dev
- Admin: https://protothrive-frontend.pages.dev/admin

---

**🚀 Everything is in Cloudflare = Maximum Performance + Minimum Cost**