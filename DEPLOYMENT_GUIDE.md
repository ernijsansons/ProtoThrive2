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

### Setting Up Admin Credentials

⚠️ **IMPORTANT**: Never hard-code credentials in documentation or code. Always use secure secret management.

Configure admin credentials through environment variables:

```bash
# Set these in your .env file or secure secret management system
ADMIN_EMAIL=<your-admin-email>
ADMIN_PASSWORD=<strong-unique-password>

# For production, use a secret management service:
# - Cloudflare Secrets (wrangler secret)
# - AWS Secrets Manager
# - HashiCorp Vault
# - Azure Key Vault
```

### Configuring Admin Access

#### Option 1: Using Environment Variables (.env)

1. Create or update `.env` file in your project root:
```bash
# Admin credentials (never commit this file!)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourSecurePasswordHere123!

# Add to .gitignore
echo ".env" >> .gitignore
```

2. For Cloudflare Workers deployment:
```bash
# Set secrets using wrangler
wrangler secret put ADMIN_EMAIL
wrangler secret put ADMIN_PASSWORD
```

#### Option 2: Using Vault/Secret Management

1. **HashiCorp Vault Example**:
```bash
# Store credentials in Vault
vault kv put secret/protothrive/admin \
  email="admin@yourdomain.com" \
  password="$(openssl rand -base64 32)"

# Load in application
vault kv get -format=json secret/protothrive/admin
```

2. **Cloudflare Secrets (Recommended for Workers)**:
```bash
# Add secrets to your Worker
wrangler secret put ADMIN_EMAIL
# Enter value when prompted (hidden input)

wrangler secret put ADMIN_PASSWORD
# Enter value when prompted (hidden input)

# List configured secrets
wrangler secret list
```

3. **Loading Secrets in Code**:
```javascript
// In your backend worker (src/index.ts or similar)
const adminEmail = env.ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const adminPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

// Validate credentials are set
if (!adminEmail || !adminPassword) {
  throw new Error('Admin credentials not configured. See deployment guide.');
}
```

### Security Best Practices

1. **Password Requirements**:
   - Minimum 16 characters
   - Include uppercase, lowercase, numbers, and special characters
   - Use a password generator for maximum entropy
   - Rotate passwords every 90 days

2. **Access Control**:
   - Enable MFA for admin accounts
   - Log all admin actions for audit trail
   - Implement session timeout (30 minutes recommended)
   - Use IP allowlisting for admin endpoints in production

3. **Secret Rotation**:
   - Implement automated key rotation
   - Keep previous version for rollback
   - Update all dependent services atomically

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
- Ensure admin credentials are properly configured via environment variables
- Verify ADMIN_EMAIL and ADMIN_PASSWORD are set in your deployment environment
- Check localStorage for `adminToken` after login
- Verify backend admin endpoints are deployed
- Confirm secrets are accessible to the Worker (use `wrangler secret list`)

## Security Notes

1. **Use strong, unique admin credentials** - never reuse passwords or use predictable patterns
2. **Store credentials securely** - use environment variables or secret management, never hard-code
3. **API keys are encrypted** in Cloudflare KV storage
4. **All admin endpoints** require super_admin role authentication
5. **CORS is configured** to accept requests from your domain
6. **Enable audit logging** for all administrative actions
7. **Implement rate limiting** on authentication endpoints to prevent brute force attacks

---

**Thermonuclear Status**: Platform Ready for Launch 🚀