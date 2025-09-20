#!/bin/bash
# ProtoThrive Production Deployment Script
# Ref: CLAUDE.md - Production Deployment Protocol

set -e  # Exit on error

echo "🚀 ProtoThrive Production Deployment Starting..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 successful${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# 1. Validate environment
echo -e "${YELLOW}Step 1: Validating environment...${NC}"
if [ ! -f backend/.env.production ]; then
    echo -e "${RED}❌ backend/.env.production not found${NC}"
    exit 1
fi
if [ ! -f frontend/.env.production ]; then
    echo -e "${RED}❌ frontend/.env.production not found${NC}"
    exit 1
fi
check_status "Environment validation"

# 2. Run tests
echo -e "${YELLOW}Step 2: Running tests...${NC}"
cd frontend && npm test -- --watchAll=false --ci
check_status "Frontend tests"
cd ..

# 3. Build frontend
echo -e "${YELLOW}Step 3: Building frontend...${NC}"
cd frontend
cp .env.production .env.local
npm run build
check_status "Frontend build"
cd ..

# 4. Deploy backend to Cloudflare Workers
echo -e "${YELLOW}Step 4: Deploying backend to Cloudflare Workers...${NC}"
cd backend
source .env.production
wrangler deploy --env production
check_status "Backend deployment"
cd ..

# 5. Deploy frontend to Cloudflare Pages
echo -e "${YELLOW}Step 5: Deploying frontend to Cloudflare Pages...${NC}"
cd frontend
npx wrangler pages deploy out --project-name=protothrive-frontend --branch=main
check_status "Frontend deployment"
cd ..

# 6. Run database migrations
echo -e "${YELLOW}Step 6: Running database migrations...${NC}"
cd backend
wrangler d1 execute protothrive-db --file=migrations/001_init.sql --env production
wrangler d1 execute protothrive-db --file=migrations/002_seed.sql --env production
check_status "Database migrations"
cd ..

# 7. Verify deployment
echo -e "${YELLOW}Step 7: Verifying deployment...${NC}"
curl -s -o /dev/null -w "%{http_code}" https://api.protothrive.com/health | grep -q "200"
check_status "API health check"

curl -s -o /dev/null -w "%{http_code}" https://protothrive.com | grep -q "200"
check_status "Frontend health check"

# 8. Clear cache (optional)
echo -e "${YELLOW}Step 8: Clearing CDN cache...${NC}"
# Add Cloudflare cache purge command here if needed
echo "Cache cleared (if configured)"

# 9. Notify team
echo -e "${YELLOW}Step 9: Sending deployment notification...${NC}"
# Add Slack/Discord webhook notification here
echo "Team notified (if configured)"

echo -e "${GREEN}✅ Thermonuclear Production Deployment Complete!${NC}"
echo "🎯 ProtoThrive is now live at:"
echo "   Frontend: https://protothrive.com"
echo "   API: https://api.protothrive.com"
echo ""
echo "📊 Next steps:"
echo "   - Monitor error logs in Sentry"
echo "   - Check performance metrics in Datadog"
echo "   - Review user analytics"
echo "   - Test critical user flows"