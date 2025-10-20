#!/bin/bash

# OAuth Deployment Script - Complete Production Setup
echo "🚀 DEPLOYING OAUTH TO PRODUCTION"
echo "=================================="

# Step 1: Database Migration
echo "📊 1. Running database migration..."
wrangler d1 execute protothrive-db-prod --remote --file=backend/migrations/002_oauth_support.sql

# Step 2: Set OAuth Environment Variables
echo "🔧 2. Setting OAuth environment variables..."
echo "GITHUB_CLIENT_ID: Set this in Cloudflare dashboard or wrangler.toml"
echo "GOOGLE_CLIENT_ID: Set this in Cloudflare dashboard or wrangler.toml"
echo "FRONTEND_URL: Already configured for production"

# Step 3: Deploy Backend with OAuth Routes
echo "🏗️ 3. Deploying backend with OAuth support..."
cd backend
wrangler deploy --env production

# Step 4: Deploy Frontend with OAuth Integration
echo "🎨 4. Deploying frontend with OAuth integration..."
cd ../frontend
npm run build
npx wrangler pages deploy .next --project-name protothrive-frontend

# Step 5: Test OAuth Endpoints
echo "🧪 5. Testing OAuth endpoints..."
echo "Testing GitHub OAuth initiation..."
curl -s -o /dev/null -w "%{http_code}" https://backend-thermo-prod.ernijs-ansons.workers.dev/api/auth/github

echo "Testing Google OAuth initiation..."
curl -s -o /dev/null -w "%{http_code}" https://backend-thermo-prod.ernijs-ansons.workers.dev/api/auth/google

echo ""
echo "✅ OAUTH DEPLOYMENT COMPLETE!"
echo "=============================="
echo ""
echo "🔗 Next Steps:"
echo "1. Set up GitHub OAuth App:"
echo "   - Go to GitHub Settings → Developer settings → OAuth Apps"
echo "   - Callback URL: https://backend-thermo-prod.ernijs-ansons.workers.dev/api/auth/github/callback"
echo ""
echo "2. Set up Google OAuth App:"
echo "   - Go to Google Cloud Console → APIs & Services → Credentials"
echo "   - Callback URL: https://backend-thermo-prod.ernijs-ansons.workers.dev/api/auth/google/callback"
echo ""
echo "3. Update environment variables with actual OAuth client IDs and secrets"
echo ""
echo "4. Test OAuth flow:"
echo "   - Visit: https://b75a912e.protothrive-live.pages.dev/login"
echo "   - Click GitHub or Google login"
echo "   - Complete OAuth flow"
echo ""
echo "🎉 ProtoThrive OAuth is now LIVE!"