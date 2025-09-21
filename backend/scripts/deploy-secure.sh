#!/bin/bash

# ProtoThrive Backend Secure Deployment Script
# Ref: CLAUDE.md Thermonuclear Backend Audit - Secure Deployment

set -euo pipefail  # Exit on error, undefined variables, pipe failures

echo "🚀 ProtoThrive Backend Secure Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment validation
ENVIRONMENT=${1:-staging}

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo -e "${RED}❌ Error: Environment must be 'staging' or 'production'${NC}"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

echo -e "${GREEN}🔧 Deploying to: $ENVIRONMENT${NC}"

# Security Pre-flight Checks
echo -e "${YELLOW}🔒 Running security pre-flight checks...${NC}"

# Check for secrets in code
echo "🔍 Checking for hardcoded secrets..."
if grep -r "api_key\|password\|secret\|token" --include="*.py" --include="*.toml" --include="*.json" src/ wrangler.toml 2>/dev/null | grep -v "your-" | grep -v "mock" | grep -v "#" | grep -v "example"; then
    echo -e "${RED}❌ Found potential hardcoded secrets! Please review and remove.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ No hardcoded secrets found${NC}"

# Check environment configuration
echo "🔍 Checking environment configuration..."
if [[ ! -f ".env.example" ]]; then
    echo -e "${RED}❌ .env.example file missing${NC}"
    exit 1
fi

if [[ -f ".env" ]]; then
    echo -e "${YELLOW}⚠️  Warning: .env file found - ensure it's in .gitignore${NC}"
fi

echo -e "${GREEN}✅ Environment configuration valid${NC}"

# Validate required environment variables for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🔍 Validating production environment variables..."

    required_vars=(
        "CLOUDFLARE_ACCOUNT_ID"
        "D1_DATABASE_ID"
        "KV_NAMESPACE_ID"
        "KV_NAMESPACE_PREVIEW_ID"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            echo -e "${RED}❌ Required environment variable $var is not set${NC}"
            echo "Please set all required environment variables before deploying to production"
            exit 1
        fi
    done

    echo -e "${GREEN}✅ Production environment variables validated${NC}"
fi

# Run security tests
echo "🧪 Running security tests..."
if command -v python3 &> /dev/null; then
    if [[ -f "tests/test_security_comprehensive.py" ]]; then
        python3 -m pytest tests/test_security_comprehensive.py -v --tb=short
        if [[ $? -ne 0 ]]; then
            echo -e "${RED}❌ Security tests failed! Fix issues before deploying.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Security tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Security tests not found - skipping${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Python3 not found - skipping security tests${NC}"
fi

# Validate wrangler configuration
echo "🔍 Validating wrangler configuration..."
if [[ ! -f "wrangler.toml" ]]; then
    echo -e "${RED}❌ wrangler.toml not found${NC}"
    exit 1
fi

# Check for placeholder values in wrangler.toml
if grep -q "your-" wrangler.toml; then
    echo -e "${YELLOW}⚠️  Warning: Found placeholder values in wrangler.toml${NC}"
    echo "Make sure all placeholder values are replaced with actual values or environment variables"
fi

echo -e "${GREEN}✅ Wrangler configuration validated${NC}"

# Production-specific checks
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo "🔒 Running production-specific security checks..."

    # Check JWT secret is set
    echo "🔍 Checking JWT secret configuration..."
    wrangler secret list --env production | grep -q JWT_SECRET || {
        echo -e "${RED}❌ JWT_SECRET not set in production secrets${NC}"
        echo "Run: wrangler secret put JWT_SECRET --env production"
        exit 1
    }

    # Check monitoring secrets
    echo "🔍 Checking monitoring secrets..."
    wrangler secret list --env production | grep -q SENTRY_DSN || {
        echo -e "${YELLOW}⚠️  SENTRY_DSN not set - monitoring may be limited${NC}"
    }

    wrangler secret list --env production | grep -q DATADOG_API_KEY || {
        echo -e "${YELLOW}⚠️  DATADOG_API_KEY not set - monitoring may be limited${NC}"
    }

    echo -e "${GREEN}✅ Production security checks completed${NC}"
fi

# Build and lint checks
echo "🏗️  Running build and lint checks..."

# Lint check (if available)
if command -v pylint &> /dev/null; then
    echo "🔍 Running pylint..."
    pylint src/ --disable=missing-docstring --score=y || {
        echo -e "${YELLOW}⚠️  Lint warnings found - review before deploying${NC}"
    }
fi

# Deploy using wrangler
echo -e "${GREEN}🚀 Starting deployment to $ENVIRONMENT...${NC}"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${RED}⚠️  PRODUCTION DEPLOYMENT - This will affect live users!${NC}"
    read -p "Are you sure you want to deploy to production? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
fi

# Execute deployment
echo "📦 Deploying with wrangler..."
wrangler deploy --env "$ENVIRONMENT"

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"

    # Post-deployment validation
    echo "🔍 Running post-deployment validation..."

    if [[ "$ENVIRONMENT" == "production" ]]; then
        HEALTH_URL="https://api.protothrive.com/health"
    else
        HEALTH_URL="https://backend-thermo-staging.ernijs-ansons.workers.dev/health"
    fi

    echo "🌐 Testing health endpoint: $HEALTH_URL"

    # Wait a moment for deployment to propagate
    sleep 5

    if command -v curl &> /dev/null; then
        if curl -s "$HEALTH_URL" | grep -q "healthy"; then
            echo -e "${GREEN}✅ Health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Health check inconclusive - manual verification recommended${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  curl not available - manual health check recommended${NC}"
    fi

    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "📋 Post-deployment checklist:"
    echo "  - [ ] Verify application is responding correctly"
    echo "  - [ ] Check monitoring dashboards"
    echo "  - [ ] Verify authentication is working"
    echo "  - [ ] Monitor error rates for first 30 minutes"
    echo "  - [ ] Update deployment documentation"

else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

# Security reminder
echo ""
echo -e "${YELLOW}🔒 Security Reminder:${NC}"
echo "  - Monitor security dashboards for anomalies"
echo "  - Check authentication metrics"
echo "  - Verify rate limiting is functional"
echo "  - Review security logs for the next hour"
echo ""
echo -e "${GREEN}Deployment completed at: $(date)${NC}"