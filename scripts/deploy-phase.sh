#!/bin/bash

# ProtoThrive - Phase Deployment Script
# Automates deployment for each roadmap phase with validation

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_URL="https://protothrive-backend.ernijs-ansons.workers.dev"
FRONTEND_URL="https://876017e2.protothrive-frontend.pages.dev"

# Deployment functions
deploy_backend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deploying Backend to Cloudflare Workers${NC}"
    echo -e "${BLUE}========================================${NC}"

    cd "$BACKEND_DIR"

    echo -e "${YELLOW}Running backend tests...${NC}"
    npm run test || {
        echo -e "${RED}❌ Backend tests failed. Aborting deployment.${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Backend tests passed${NC}"

    echo -e "${YELLOW}Building backend...${NC}"
    npm run build || {
        echo -e "${RED}❌ Backend build failed. Aborting deployment.${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Backend build successful${NC}"

    echo -e "${YELLOW}Deploying to Cloudflare Workers (production)...${NC}"
    wrangler deploy --env production || {
        echo -e "${RED}❌ Backend deployment failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Backend deployed successfully${NC}"

    cd ..

    # Wait for deployment to propagate
    echo -e "${YELLOW}Waiting for deployment to propagate (10 seconds)...${NC}"
    sleep 10

    # Verify deployment
    echo -e "${YELLOW}Verifying backend deployment...${NC}"
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")

    if [ "$status_code" == "200" ]; then
        echo -e "${GREEN}✅ Backend is responding (200 OK)${NC}"
    else
        echo -e "${RED}❌ Backend health check failed (HTTP ${status_code})${NC}"
        exit 1
    fi
}

deploy_frontend() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Deploying Frontend to Cloudflare Pages${NC}"
    echo -e "${BLUE}========================================${NC}"

    cd "$FRONTEND_DIR"

    echo -e "${YELLOW}Running frontend linter...${NC}"
    npm run lint || {
        echo -e "${YELLOW}⚠️  Linting warnings detected, but continuing...${NC}"
    }

    echo -e "${YELLOW}Building frontend...${NC}"
    npm run build || {
        echo -e "${RED}❌ Frontend build failed. Aborting deployment.${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Frontend build successful${NC}"

    echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"
    npx wrangler pages deploy out --project-name=protothrive-frontend --commit-dirty=true || {
        echo -e "${RED}❌ Frontend deployment failed${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Frontend deployed successfully${NC}"

    cd ..

    # Wait for deployment to propagate
    echo -e "${YELLOW}Waiting for deployment to propagate (15 seconds)...${NC}"
    sleep 15

    # Verify deployment
    echo -e "${YELLOW}Verifying frontend deployment...${NC}"
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")

    if [ "$status_code" == "200" ]; then
        echo -e "${GREEN}✅ Frontend is responding (200 OK)${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed (HTTP ${status_code})${NC}"
        exit 1
    fi
}

# Phase-specific deployments
deploy_phase_0() {
    echo -e "${YELLOW}Phase 0: Critical Security Fixes${NC}"
    echo -e "${YELLOW}Deploying backend security headers...${NC}"
    deploy_backend

    echo -e "${YELLOW}Deploying frontend HTML lang attribute...${NC}"
    deploy_frontend

    echo -e "${GREEN}Phase 0 deployment complete!${NC}"
}

deploy_phase_1() {
    echo -e "${YELLOW}Phase 1: API Authentication${NC}"
    echo -e "${YELLOW}Deploying backend auth middleware...${NC}"
    deploy_backend

    echo -e "${GREEN}Phase 1 deployment complete!${NC}"
}

deploy_phase_2() {
    echo -e "${YELLOW}Phase 2: Authentication Routes & Backend${NC}"
    echo -e "${YELLOW}Deploying backend auth endpoints...${NC}"
    deploy_backend

    echo -e "${YELLOW}Deploying frontend auth pages...${NC}"
    deploy_frontend

    echo -e "${GREEN}Phase 2 deployment complete!${NC}"
}

deploy_phase_3() {
    echo -e "${YELLOW}Phase 3: Accessibility WCAG 2.1${NC}"
    echo -e "${YELLOW}Deploying frontend accessibility improvements...${NC}"
    deploy_frontend

    echo -e "${GREEN}Phase 3 deployment complete!${NC}"
}

deploy_phase_4() {
    echo -e "${YELLOW}Phase 4: Mobile UX Enhancement${NC}"
    echo -e "${YELLOW}Deploying frontend mobile improvements...${NC}"
    deploy_frontend

    echo -e "${GREEN}Phase 4 deployment complete!${NC}"
}

deploy_phase_5() {
    echo -e "${YELLOW}Phase 5: Performance Optimization${NC}"
    echo -e "${YELLOW}Deploying optimized frontend bundle...${NC}"
    deploy_frontend

    echo -e "${GREEN}Phase 5 deployment complete!${NC}"
}

deploy_phase_6() {
    echo -e "${YELLOW}Phase 6: Final Polish & Regression${NC}"
    echo -e "${YELLOW}Deploying final backend changes...${NC}"
    deploy_backend

    echo -e "${YELLOW}Deploying final frontend changes...${NC}"
    deploy_frontend

    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 Phase 6 deployment complete!${NC}"
    echo -e "${GREEN}Platform is 100% Production Ready! 🚀${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Rollback function
rollback_deployment() {
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}Rolling back deployment${NC}"
    echo -e "${RED}========================================${NC}"

    echo -e "${YELLOW}Listing recent backend deployments...${NC}"
    wrangler deployments list

    echo ""
    read -p "Enter deployment ID to rollback to (or 'skip' to skip backend rollback): " deployment_id

    if [ "$deployment_id" != "skip" ]; then
        echo -e "${YELLOW}Rolling back backend to ${deployment_id}...${NC}"
        wrangler rollback "$deployment_id"
        echo -e "${GREEN}✅ Backend rolled back${NC}"
    fi

    echo ""
    echo -e "${YELLOW}For frontend rollback, use Cloudflare Dashboard:${NC}"
    echo -e "${BLUE}https://dash.cloudflare.com > Pages > protothrive-frontend > Deployments${NC}"
    echo -e "${YELLOW}Promote a previous deployment to rollback${NC}"
}

# Pre-deployment checks
pre_deployment_checks() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Running Pre-Deployment Checks${NC}"
    echo -e "${BLUE}========================================${NC}"

    # Check if in correct directory
    if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
        echo -e "${RED}❌ Error: backend or frontend directory not found${NC}"
        echo -e "${RED}Please run this script from the project root${NC}"
        exit 1
    fi

    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ Error: wrangler CLI not found${NC}"
        echo -e "${YELLOW}Install with: npm install -g wrangler${NC}"
        exit 1
    fi

    # Check if dependencies are installed
    if [ ! -d "$BACKEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        cd "$BACKEND_DIR" && npm install && cd ..
    fi

    if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
        echo -e "${YELLOW}Installing frontend dependencies...${NC}"
        cd "$FRONTEND_DIR" && npm install && cd ..
    fi

    echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"
}

# Main execution
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <phase_number> [options]"
    echo ""
    echo "Available phases:"
    echo "  0 - Critical Security Fixes (backend + frontend)"
    echo "  1 - API Authentication (backend only)"
    echo "  2 - Authentication Routes & Backend (backend + frontend)"
    echo "  3 - Accessibility WCAG 2.1 (frontend only)"
    echo "  4 - Mobile UX Enhancement (frontend only)"
    echo "  5 - Performance Optimization (frontend only)"
    echo "  6 - Final Polish & Regression (backend + frontend)"
    echo ""
    echo "Options:"
    echo "  --skip-checks    Skip pre-deployment checks"
    echo "  --backend-only   Deploy backend only"
    echo "  --frontend-only  Deploy frontend only"
    echo "  --rollback       Rollback to previous deployment"
    echo ""
    echo "Examples:"
    echo "  $0 0                    # Deploy Phase 0"
    echo "  $0 2 --backend-only     # Deploy Phase 2 backend only"
    echo "  $0 --rollback           # Rollback deployment"
    exit 1
fi

# Parse arguments
PHASE=$1
SKIP_CHECKS=false
BACKEND_ONLY=false
FRONTEND_ONLY=false
ROLLBACK=false

for arg in "$@"; do
    case $arg in
        --skip-checks)
            SKIP_CHECKS=true
            ;;
        --backend-only)
            BACKEND_ONLY=true
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            ;;
        --rollback)
            ROLLBACK=true
            ;;
    esac
done

# Handle rollback
if [ "$ROLLBACK" = true ]; then
    rollback_deployment
    exit 0
fi

# Run pre-deployment checks
if [ "$SKIP_CHECKS" = false ]; then
    pre_deployment_checks
fi

# Deploy based on phase
case $PHASE in
    0)
        if [ "$BACKEND_ONLY" = true ]; then
            deploy_backend
        elif [ "$FRONTEND_ONLY" = true ]; then
            deploy_frontend
        else
            deploy_phase_0
        fi
        ;;
    1)
        if [ "$FRONTEND_ONLY" = true ]; then
            echo -e "${YELLOW}⚠️  Phase 1 only requires backend deployment${NC}"
        fi
        deploy_backend
        ;;
    2)
        if [ "$BACKEND_ONLY" = true ]; then
            deploy_backend
        elif [ "$FRONTEND_ONLY" = true ]; then
            deploy_frontend
        else
            deploy_phase_2
        fi
        ;;
    3)
        if [ "$BACKEND_ONLY" = true ]; then
            echo -e "${YELLOW}⚠️  Phase 3 only requires frontend deployment${NC}"
        fi
        deploy_frontend
        ;;
    4)
        if [ "$BACKEND_ONLY" = true ]; then
            echo -e "${YELLOW}⚠️  Phase 4 only requires frontend deployment${NC}"
        fi
        deploy_frontend
        ;;
    5)
        if [ "$BACKEND_ONLY" = true ]; then
            echo -e "${YELLOW}⚠️  Phase 5 only requires frontend deployment${NC}"
        fi
        deploy_frontend
        ;;
    6)
        if [ "$BACKEND_ONLY" = true ]; then
            deploy_backend
        elif [ "$FRONTEND_ONLY" = true ]; then
            deploy_frontend
        else
            deploy_phase_6
        fi
        ;;
    *)
        echo -e "${RED}Invalid phase: ${PHASE}${NC}"
        echo "Valid phases: 0, 1, 2, 3, 4, 5, 6"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Phase ${PHASE} deployed successfully!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Run validation: ${BLUE}./scripts/validate-phase.sh ${PHASE}${NC}"
echo -e "2. Monitor for errors: ${BLUE}wrangler tail${NC}"
echo -e "3. Check frontend: ${BLUE}${FRONTEND_URL}${NC}"
echo -e "4. Check backend: ${BLUE}${BACKEND_URL}/health${NC}"
