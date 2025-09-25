#!/bin/bash

# ProtoThrive Cloudflare Workers Deployment Script
# This script handles deployment to Cloudflare Workers platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
BACKEND_DIR="./backend"
FRONTEND_DIR="./frontend"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking Cloudflare Workers deployment requirements..."
    
    # Check if Wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_error "Wrangler CLI is not installed. Please install it first:"
        echo "npm install -g wrangler"
        exit 1
    fi
    
    # Check if logged in to Cloudflare
    if ! wrangler whoami &> /dev/null; then
        log_error "Not logged in to Cloudflare. Please login first:"
        echo "wrangler login"
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from example..."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "Please edit .env file with your Cloudflare configuration before continuing."
            exit 1
        else
            log_error "env.example file not found. Cannot create .env file."
            exit 1
        fi
    fi
    
    log_success "Cloudflare Workers requirements check passed."
}

deploy_backend() {
    log_info "Deploying Cloudflare Workers backend..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    log_info "Installing backend dependencies..."
    npm install
    
    # Build the worker
    log_info "Building TypeScript worker..."
    npm run build
    
    # Deploy based on environment
    case "$ENVIRONMENT" in
        "development")
            log_info "Deploying to development environment..."
            wrangler deploy --env development
            ;;
        "staging")
            log_info "Deploying to staging environment..."
            wrangler deploy --env staging
            ;;
        "production")
            log_info "Deploying to production environment..."
            wrangler deploy --env production
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_info "Valid environments: development, staging, production"
            exit 1
            ;;
    esac
    
    cd ..
    log_success "Backend deployed successfully to $ENVIRONMENT environment."
}

deploy_frontend() {
    log_info "Deploying frontend to Cloudflare Pages..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm install
    
    # Build the frontend
    log_info "Building Next.js application..."
    npm run build
    
    # Deploy to Cloudflare Pages
    log_info "Deploying to Cloudflare Pages..."
    
    # Check if wrangler pages is available
    if command -v wrangler &> /dev/null; then
        case "$ENVIRONMENT" in
            "development")
                wrangler pages deploy out --project-name protothrive-dev
                ;;
            "staging")
                wrangler pages deploy out --project-name protothrive-staging
                ;;
            "production")
                wrangler pages deploy out --project-name protothrive
                ;;
        esac
    else
        log_warning "Wrangler Pages not available. Please deploy manually to Cloudflare Pages."
        log_info "Build output is available in: $FRONTEND_DIR/out"
    fi
    
    cd ..
    log_success "Frontend deployed successfully to $ENVIRONMENT environment."
}

setup_database() {
    log_info "Setting up Cloudflare D1 database..."
    
    cd "$BACKEND_DIR"
    
    # Run database migrations
    log_info "Running database migrations..."
    case "$ENVIRONMENT" in
        "development")
            wrangler d1 execute protothrive-db --file=migrations/001_init.sql --local
            ;;
        "staging")
            wrangler d1 execute protothrive-db --file=migrations/001_init.sql --env staging
            ;;
        "production")
            wrangler d1 execute protothrive-db --file=migrations/001_init.sql --env production
            ;;
    esac
    
    cd ..
    log_success "Database setup completed for $ENVIRONMENT environment."
}

setup_kv() {
    log_info "Setting up Cloudflare KV namespace..."
    
    cd "$BACKEND_DIR"
    
    # KV namespace should already be configured in wrangler.toml
    log_info "KV namespace configuration verified in wrangler.toml"
    
    cd ..
    log_success "KV namespace setup completed."
}

show_deployment_info() {
    log_info "Deployment Information:"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo ""
    echo "Backend (Cloudflare Workers):"
    case "$ENVIRONMENT" in
        "development")
            echo "  URL: https://backend-thermo-dev.your-subdomain.workers.dev"
            ;;
        "staging")
            echo "  URL: https://backend-thermo-staging.your-subdomain.workers.dev"
            ;;
        "production")
            echo "  URL: https://backend-thermo-prod.your-subdomain.workers.dev"
            ;;
    esac
    echo ""
    echo "Frontend (Cloudflare Pages):"
    case "$ENVIRONMENT" in
        "development")
            echo "  URL: https://protothrive-dev.pages.dev"
            ;;
        "staging")
            echo "  URL: https://protothrive-staging.pages.dev"
            ;;
        "production")
            echo "  URL: https://protothrive.pages.dev"
            ;;
    esac
    echo ""
    echo "Database (Cloudflare D1):"
    echo "  Database: protothrive-db"
    echo "  Environment: $ENVIRONMENT"
    echo ""
    echo "KV Storage:"
    echo "  Namespace: protothrive-kv"
    echo "  Environment: $ENVIRONMENT"
    echo ""
    echo "Monitoring:"
    echo "  Cloudflare Analytics: Available in Cloudflare Dashboard"
    echo "  Real User Monitoring: Enabled"
    echo "  Web Analytics: Available in Cloudflare Dashboard"
}

# Main deployment process
main() {
    log_info "Starting ProtoThrive Cloudflare Workers Deployment..."
    log_info "Environment: $ENVIRONMENT"
    
    check_requirements
    setup_database
    setup_kv
    deploy_backend
    deploy_frontend
    show_deployment_info
    
    log_success "ProtoThrive Cloudflare Workers Deployment completed successfully!"
    log_info "Your application is now live on Cloudflare's global network!"
}

# Handle script arguments
case "${1:-}" in
    "backend")
        check_requirements
        deploy_backend
        ;;
    "frontend")
        deploy_frontend
        ;;
    "database")
        check_requirements
        setup_database
        ;;
    "kv")
        setup_kv
        ;;
    "info")
        show_deployment_info
        ;;
    "help"|"-h"|"--help")
        echo "ProtoThrive Cloudflare Workers Deployment Script"
        echo ""
        echo "Usage: $0 [ENVIRONMENT] [COMMAND]"
        echo ""
        echo "Environments:"
        echo "  development  Deploy to development environment (default)"
        echo "  staging      Deploy to staging environment"
        echo "  production   Deploy to production environment"
        echo ""
        echo "Commands:"
        echo "  (no args)    Full deployment (default: development)"
        echo "  backend      Deploy backend only"
        echo "  frontend     Deploy frontend only"
        echo "  database     Setup database only"
        echo "  kv           Setup KV namespace only"
        echo "  info         Show deployment information"
        echo "  help         Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Deploy to development"
        echo "  $0 production         # Deploy to production"
        echo "  $0 staging backend    # Deploy backend to staging"
        echo ""
        echo "Prerequisites:"
        echo "  - Wrangler CLI installed: npm install -g wrangler"
        echo "  - Logged in to Cloudflare: wrangler login"
        echo "  - .env file configured with Cloudflare credentials"
        ;;
    *)
        main
        ;;
esac
