#!/bin/bash

# Production Deployment Script for ProtoThrive Frontend
set -e

echo "🚀 Starting ProtoThrive Frontend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="protothrive-frontend"
VERSION=${1:-"latest"}
ENVIRONMENT=${2:-"production"}
DOCKER_REGISTRY=${3:-"your-registry.com"}

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  App Name: $APP_NAME"
echo "  Version: $VERSION"
echo "  Environment: $ENVIRONMENT"
echo "  Registry: $DOCKER_REGISTRY"

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All dependencies are installed${NC}"
}

# Run tests
run_tests() {
    echo -e "${BLUE}🧪 Running tests...${NC}"
    npm run test:ci
    echo -e "${GREEN}✅ Tests passed${NC}"
}

# Build the application
build_app() {
    echo -e "${BLUE}🔨 Building application...${NC}"
    
    # Install dependencies
    echo "Installing dependencies..."
    npm ci --only=production
    
    # Build for production
    echo "Building for production..."
    npm run build:production
    
    echo -e "${GREEN}✅ Application built successfully${NC}"
}

# Build Docker image
build_docker() {
    echo -e "${BLUE}🐳 Building Docker image...${NC}"
    
    docker build -t $APP_NAME:$VERSION .
    docker tag $APP_NAME:$VERSION $DOCKER_REGISTRY/$APP_NAME:$VERSION
    docker tag $APP_NAME:$VERSION $DOCKER_REGISTRY/$APP_NAME:latest
    
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
}

# Push to registry
push_docker() {
    echo -e "${BLUE}📤 Pushing to registry...${NC}"
    
    docker push $DOCKER_REGISTRY/$APP_NAME:$VERSION
    docker push $DOCKER_REGISTRY/$APP_NAME:latest
    
    echo -e "${GREEN}✅ Images pushed successfully${NC}"
}

# Deploy to production
deploy_production() {
    echo -e "${BLUE}🚀 Deploying to production...${NC}"
    
    # Stop existing containers
    echo "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # Start new containers
    echo "Starting new containers..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for health check
    echo "Waiting for health check..."
    sleep 30
    
    # Check if application is running
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Application is running successfully${NC}"
    else
        echo -e "${RED}❌ Application health check failed${NC}"
        exit 1
    fi
}

# Cleanup old images
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up old images...${NC}"
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images $APP_NAME --format "table {{.Tag}}\t{{.ID}}" | grep -v latest | tail -n +4 | awk '{print $2}' | xargs -r docker rmi || true
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main deployment flow
main() {
    echo -e "${YELLOW}🎯 Starting deployment process...${NC}"
    
    check_dependencies
    run_tests
    build_app
    build_docker
    push_docker
    deploy_production
    cleanup
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Application is available at: https://protothrive.com${NC}"
}

# Run main function
main "$@"
