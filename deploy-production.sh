#!/bin/bash
# Thermonuclear Production Deployment Script for ProtoThrive
# Deploys both backend (Cloudflare Workers) and frontend (Cloudflare Pages)

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment setup
ENVIRONMENT=${1:-production}
echo -e "${BLUE}🚀 Thermonuclear Deployment: ProtoThrive ${ENVIRONMENT}${NC}"
echo "======================================================"

# Check for required tools
echo -e "${YELLOW}🔧 Checking deployment tools...${NC}"
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ wrangler CLI not found. Please install it first.${NC}"
    echo "Run: npm install -g wrangler"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check for authentication
echo -e "${YELLOW}🔑 Checking Cloudflare authentication...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Cloudflare. Please run: wrangler login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All deployment tools ready${NC}"
echo ""

# Create or check .dev.vars file
echo -e "${YELLOW}🔧 Setting up environment variables...${NC}"
if [ ! -f ".dev.vars" ]; then
    echo "# Cloudflare Environment Variables" > .dev.vars
    echo "# Replace with your actual values" >> .dev.vars
    echo "D1_DB_ID=your-d1-database-id" >> .dev.vars
    echo "KV_ID=your-kv-namespace-id" >> .dev.vars
    echo "CF_ACCOUNT_ID=your-cloudflare-account-id" >> .dev.vars
    echo "CLOUDFLARE_API_TOKEN=your-api-token" >> .dev.vars
    echo -e "${YELLOW}⚠️  Created .dev.vars template. Please fill in your actual values.${NC}"
fi

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
npm ci

# Install workspace dependencies  
echo -e "${YELLOW}📦 Installing workspace dependencies...${NC}"
npm run install-workspaces

# Deploy Backend (Cloudflare Workers)
echo ""
echo -e "${BLUE}🔨 Deploying Backend (Cloudflare Workers)...${NC}"
cd backend

# Build backend
echo -e "${YELLOW}Building backend...${NC}"
npm run build

# Deploy backend to specified environment
echo -e "${YELLOW}Deploying backend to ${ENVIRONMENT}...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler deploy --env production
    echo -e "${GREEN}✅ Backend deployed to production${NC}"
    echo -e "${GREEN}Backend URL: https://backend-thermo-prod.your-subdomain.workers.dev${NC}"
elif [ "$ENVIRONMENT" = "staging" ]; then
    wrangler deploy --env staging
    echo -e "${GREEN}✅ Backend deployed to staging${NC}"
    echo -e "${GREEN}Backend URL: https://backend-thermo-staging.your-subdomain.workers.dev${NC}"
else
    wrangler deploy --env development
    echo -e "${GREEN}✅ Backend deployed to development${NC}"
    echo -e "${GREEN}Backend URL: https://backend-thermo-dev.your-subdomain.workers.dev${NC}"
fi

cd ..

# Deploy Frontend (Cloudflare Pages)
echo ""
echo -e "${BLUE}🎨 Deploying Frontend (Cloudflare Pages)...${NC}"
cd frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm ci
fi

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
npm run build

# Check if build was successful
if [ ! -d "out" ]; then
    echo -e "${RED}❌ Frontend build failed - no out directory found${NC}"
    exit 1
fi

# Deploy frontend to Cloudflare Pages
echo -e "${YELLOW}Deploying frontend to Cloudflare Pages...${NC}"
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler pages deploy out \
        --project-name=protothrive-frontend \
        --branch=main \
        --commit-message="Production deployment - $(date '+%Y-%m-%d %H:%M:%S')"
    FRONTEND_URL="https://protothrive-frontend.pages.dev"
else
    wrangler pages deploy out \
        --project-name=protothrive-frontend \
        --branch="$ENVIRONMENT" \
        --commit-message="$ENVIRONMENT deployment - $(date '+%Y-%m-%d %H:%M:%S')"
    FRONTEND_URL="https://$ENVIRONMENT.protothrive-frontend.pages.dev"
fi

cd ..

# Deployment Summary
echo ""
echo "======================================================"
echo -e "${GREEN}🎉 Thermonuclear Deployment Complete!${NC}"
echo "======================================================"
echo ""
echo -e "${BLUE}🌐 Frontend URL:${NC} $FRONTEND_URL"
echo -e "${BLUE}🔐 Admin Portal:${NC} $FRONTEND_URL/admin-login"
echo -e "${BLUE}⚡ Backend API:${NC} https://backend-thermo-${ENVIRONMENT}.your-subdomain.workers.dev"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Visit the admin portal and configure API keys"
echo "2. Test the Magic Canvas and Insights Panel"  
echo "3. Verify backend API endpoints are responding"
echo "4. Check database migrations are applied"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT NOTES:${NC}"
    echo "- Ensure all environment variables are set correctly"
    echo "- Verify database migrations are applied"
    echo "- Test all critical user workflows"
    echo "- Monitor logs for any deployment issues"
fi

echo -e "${GREEN}✅ Deployment script completed successfully${NC}"