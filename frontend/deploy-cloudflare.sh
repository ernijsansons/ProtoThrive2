#!/bin/bash

# ProtoThrive Frontend - Cloudflare Pages Deployment Script
# Enterprise-grade deployment with comprehensive validation

set -e

echo "🚀 ProtoThrive Frontend - Cloudflare Pages Deployment"
echo "=================================================="

# Configuration
FRONTEND_DIR="frontend"
ENVIRONMENT=${1:-staging}
PROJECT_NAME="protothrive-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Pre-deployment validation
validate_deployment() {
    log "🔍 Pre-deployment validation..."
    
    # Check if we're in the right directory
    if [ ! -d "$FRONTEND_DIR" ]; then
        error "Frontend directory not found. Please run from project root."
        exit 1
    fi
    
    cd "$FRONTEND_DIR"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        error "package.json not found in frontend directory"
        exit 1
    fi
    
    # Check if next.config.js exists
    if [ ! -f "next.config.js" ]; then
        error "next.config.js not found"
        exit 1
    fi
    
    # Check if wrangler.toml exists
    if [ ! -f "wrangler.toml" ]; then
        error "wrangler.toml not found"
        exit 1
    fi
    
    success "Pre-deployment validation passed"
}

# Install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        npm ci
    fi
    
    success "Dependencies installed"
}

# Build the application
build_application() {
    log "🔨 Building application for $ENVIRONMENT..."
    
    # Set environment variables
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build the application
    npm run build
    
    # Verify build output
    if [ ! -d ".next" ]; then
        error "Build failed - .next directory not found"
        exit 1
    fi
    
    success "Application built successfully"
}

# Deploy to Cloudflare Pages
deploy_to_cloudflare() {
    log "☁️ Deploying to Cloudflare Pages..."
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log "Installing Wrangler CLI..."
        npm install -g wrangler
    fi
    
    # Authenticate with Cloudflare (if not already authenticated)
    if ! wrangler whoami &> /dev/null; then
        warning "Please authenticate with Cloudflare:"
        wrangler login
    fi
    
    # Deploy based on environment
    case $ENVIRONMENT in
        "production")
            log "Deploying to production environment..."
            wrangler pages deploy .next --project-name="$PROJECT_NAME" --env=production
            ;;
        "staging")
            log "Deploying to staging environment..."
            wrangler pages deploy .next --project-name="$PROJECT_NAME" --env=staging
            ;;
        "development")
            log "Deploying to development environment..."
            wrangler pages deploy .next --project-name="$PROJECT_NAME" --env=development
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use: production, staging, or development"
            exit 1
            ;;
    esac
    
    success "Deployment completed"
}

# Post-deployment validation
validate_deployment_success() {
    log "✅ Post-deployment validation..."
    
    # Get deployment URL
    case $ENVIRONMENT in
        "production")
            URL="https://protothrive.com"
            ;;
        "staging")
            URL="https://protothrive-frontend-staging.pages.dev"
            ;;
        "development")
            URL="https://protothrive-frontend-dev.pages.dev"
            ;;
    esac
    
    # Wait a moment for deployment to propagate
    sleep 10
    
    # Test the deployment
    if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
        success "Deployment validation passed - Site is accessible at $URL"
    else
        warning "Deployment may still be propagating. Check $URL in a few minutes."
    fi
}

# Performance testing
performance_test() {
    log "⚡ Running performance tests..."
    
    # Basic performance check
    case $ENVIRONMENT in
        "production")
            URL="https://protothrive.com"
            ;;
        "staging")
            URL="https://protothrive-frontend-staging.pages.dev"
            ;;
        "development")
            URL="https://protothrive-frontend-dev.pages.dev"
            ;;
    esac
    
    # Test response time
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL")
    
    if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
        success "Performance test passed - Response time: ${RESPONSE_TIME}s"
    else
        warning "Performance test - Response time: ${RESPONSE_TIME}s (may need optimization)"
    fi
}

# Main deployment flow
main() {
    log "Starting ProtoThrive Frontend deployment to $ENVIRONMENT"
    
    validate_deployment
    install_dependencies
    build_application
    deploy_to_cloudflare
    validate_deployment_success
    performance_test
    
    success "🎉 ProtoThrive Frontend deployment completed successfully!"
    log "Environment: $ENVIRONMENT"
    log "Project: $PROJECT_NAME"
    
    case $ENVIRONMENT in
        "production")
            log "Production URL: https://protothrive.com"
            ;;
        "staging")
            log "Staging URL: https://protothrive-frontend-staging.pages.dev"
            ;;
        "development")
            log "Development URL: https://protothrive-frontend-dev.pages.dev"
            ;;
    esac
}

# Run main function
main "$@"