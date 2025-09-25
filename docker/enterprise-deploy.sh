#!/bin/bash

# Enterprise Docker Deployment Script for ProtoThrive
# Implements comprehensive deployment with security, monitoring, and best practices

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.env"
DOCKER_COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.enterprise.yml"
REGISTRY_COMPOSE_FILE="${SCRIPT_DIR}/docker-registry.yml"
LOG_FILE="/tmp/protothrive-deploy-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${BLUE}[$timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

error() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${RED}[ERROR $timestamp]${NC} $message" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${YELLOW}[WARNING $timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

success() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${GREEN}[SUCCESS $timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

info() {
    local message="$1"
    local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
    echo -e "${PURPLE}[INFO $timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

# =============================================================================
# Function: Check prerequisites
# =============================================================================
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        error "Docker is not installed or not in PATH"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    # Check Docker daemon
    if ! docker info >/dev/null 2>&1; then
        error "Docker daemon is not running"
    fi
    
    # Check available disk space (minimum 10GB)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [ "$available_space" -lt 10485760 ]; then  # 10GB in KB
        warning "Low disk space: $(($available_space / 1024 / 1024))GB available (minimum 10GB recommended)"
    fi
    
    # Check available memory (minimum 8GB)
    local available_memory=$(free -m | awk 'NR==2{print $7}')
    if [ "$available_memory" -lt 8192 ]; then
        warning "Low memory: ${available_memory}MB available (minimum 8GB recommended)"
    fi
    
    success "Prerequisites check completed"
}

# =============================================================================
# Function: Setup environment
# =============================================================================
setup_environment() {
    log "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        log "Creating environment file..."
        cat > "$ENV_FILE" << EOF
# ProtoThrive Enterprise Environment Configuration
# Generated on $(date)

# Environment
NODE_ENV=production
ENVIRONMENT=production

# Database Configuration
POSTGRES_PASSWORD=$(openssl rand -base64 32)
DATABASE_URL=postgresql://protothrive:$(openssl rand -base64 32)@postgres:5432/protothrive

# Redis Configuration
REDIS_PASSWORD=$(openssl rand -base64 32)
REDIS_URL=redis://redis:6379

# JWT and Encryption
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Spline Configuration
NEXT_PUBLIC_SPLINE_SCENE=https://prod.spline.design/your_scene_url

# Monitoring Configuration
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Registry Configuration
REGISTRY_USERNAME=protothrive
REGISTRY_PASSWORD=$(openssl rand -base64 32)
REGISTRY_HTTP_SECRET=$(openssl rand -base64 32)

# Port Configuration
FRONTEND_PORT=3000
BACKEND_PORT=8787
POSTGRES_PORT=5432
REDIS_PORT=6379
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
JAEGER_UI_PORT=16686
JAEGER_AGENT_PORT=14268
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025
REGISTRY_PORT=5000
REGISTRY_UI_PORT=8080
REGISTRY_MONITOR_PORT=9091
EOF
        success "Environment file created: $ENV_FILE"
    else
        info "Environment file already exists: $ENV_FILE"
    fi
    
    # Create necessary directories
    mkdir -p "${PROJECT_ROOT}/database/init"
    mkdir -p "${PROJECT_ROOT}/database/backups"
    mkdir -p "${PROJECT_ROOT}/monitoring/prometheus"
    mkdir -p "${PROJECT_ROOT}/monitoring/grafana/provisioning"
    mkdir -p "${PROJECT_ROOT}/monitoring/grafana/dashboards"
    mkdir -p "${PROJECT_ROOT}/nginx/conf.d"
    mkdir -p "${PROJECT_ROOT}/nginx/ssl"
    mkdir -p "${PROJECT_ROOT}/backups/registry"
    
    success "Environment setup completed"
}

# =============================================================================
# Function: Build enterprise images
# =============================================================================
build_images() {
    log "Building enterprise Docker images..."
    
    # Build frontend image
    log "Building frontend image..."
    docker build \
        -f "${PROJECT_ROOT}/frontend/Dockerfile.enterprise" \
        -t protothrive-frontend:enterprise \
        --target runner \
        --build-arg NODE_ENV=production \
        "${PROJECT_ROOT}/frontend" || error "Failed to build frontend image"
    
    # Build backend image
    log "Building backend image..."
    docker build \
        -f "${PROJECT_ROOT}/backend/Dockerfile.enterprise" \
        -t protothrive-backend:enterprise \
        --target runner \
        --build-arg ENVIRONMENT=production \
        "${PROJECT_ROOT}/backend" || error "Failed to build backend image"
    
    success "Enterprise images built successfully"
}

# =============================================================================
# Function: Security scan
# =============================================================================
security_scan() {
    log "Running security scan on built images..."
    
    # Make security scan script executable
    chmod +x "${SCRIPT_DIR}/security-scan.sh"
    
    # Run security scan
    if "${SCRIPT_DIR}/security-scan.sh"; then
        success "Security scan completed successfully"
    else
        warning "Security scan completed with warnings"
    fi
}

# =============================================================================
# Function: Setup registry
# =============================================================================
setup_registry() {
    log "Setting up Docker registry..."
    
    # Create registry configuration
    cat > "${SCRIPT_DIR}/registry-config.yml" << EOF
version: 0.1
log:
  level: info
  fields:
    service: registry
storage:
  filesystem:
    rootdirectory: /var/lib/registry
  delete:
    enabled: true
  maintenance:
    uploadpurging:
      enabled: true
      age: 168h
      interval: 24h
      dryrun: false
http:
  addr: :5000
  headers:
    X-Content-Type-Options: [nosniff]
    Access-Control-Allow-Origin: ['*']
    Access-Control-Allow-Methods: ['HEAD', 'GET', 'OPTIONS', 'DELETE']
    Access-Control-Allow-Headers: ['Authorization', 'Accept', 'Cache-Control']
health:
  storagedriver:
    enabled: true
    interval: 10s
    threshold: 3
EOF
    
    # Start registry
    docker-compose -f "$REGISTRY_COMPOSE_FILE" up -d || error "Failed to start registry"
    
    # Wait for registry to be ready
    local max_attempts=30
    local attempt=1
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:5000/v2/ >/dev/null 2>&1; then
            success "Registry is ready"
            break
        fi
        log "Waiting for registry to be ready... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        error "Registry failed to start within expected time"
    fi
}

# =============================================================================
# Function: Push images to registry
# =============================================================================
push_images() {
    log "Pushing images to registry..."
    
    # Tag images for registry
    docker tag protothrive-frontend:enterprise localhost:5000/protothrive-frontend:enterprise
    docker tag protothrive-backend:enterprise localhost:5000/protothrive-backend:enterprise
    
    # Push images
    docker push localhost:5000/protothrive-frontend:enterprise || error "Failed to push frontend image"
    docker push localhost:5000/protothrive-backend:enterprise || error "Failed to push backend image"
    
    success "Images pushed to registry successfully"
}

# =============================================================================
# Function: Deploy services
# =============================================================================
deploy_services() {
    log "Deploying enterprise services..."
    
    # Pull latest images
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull || warning "Failed to pull some images"
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || error "Failed to start services"
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        local unhealthy_services=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --services --filter "health=unhealthy" | wc -l)
        if [ "$unhealthy_services" -eq 0 ]; then
            success "All services are healthy"
            break
        fi
        
        log "Waiting for services to be healthy... ($unhealthy_services unhealthy, attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        warning "Some services may not be fully healthy yet"
    fi
}

# =============================================================================
# Function: Verify deployment
# =============================================================================
verify_deployment() {
    log "Verifying deployment..."
    
    # Check service status
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    # Test endpoints
    local endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:8787/health"
        "http://localhost:9090/-/healthy"
        "http://localhost:3001/api/health"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f "$endpoint" >/dev/null 2>&1; then
            success "Endpoint $endpoint is responding"
        else
            warning "Endpoint $endpoint is not responding"
        fi
    done
    
    # Display service URLs
    info "Service URLs:"
    info "  Frontend: http://localhost:3000"
    info "  Backend API: http://localhost:8787"
    info "  Grafana: http://localhost:3001"
    info "  Prometheus: http://localhost:9090"
    info "  Registry UI: http://localhost:8080"
    info "  Kibana: http://localhost:5601"
    info "  Jaeger: http://localhost:16686"
    info "  MinIO Console: http://localhost:9001"
}

# =============================================================================
# Function: Cleanup
# =============================================================================
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -f /tmp/protothrive-*
    
    success "Cleanup completed"
}

# =============================================================================
# Function: Display help
# =============================================================================
show_help() {
    cat << EOF
ProtoThrive Enterprise Docker Deployment Script

Usage: $0 [OPTIONS]

Options:
    -h, --help          Show this help message
    -s, --skip-build    Skip building images (use existing ones)
    -r, --skip-registry Skip registry setup
    -c, --cleanup       Clean up before deployment
    -v, --verbose       Enable verbose output
    --dry-run          Show what would be done without executing

Examples:
    $0                  # Full deployment
    $0 --skip-build     # Deploy without rebuilding images
    $0 --cleanup        # Clean up and deploy fresh
    $0 --dry-run        # Show deployment plan

EOF
}

# =============================================================================
# Main execution
# =============================================================================
main() {
    local skip_build=false
    local skip_registry=false
    local cleanup_first=false
    local verbose=false
    local dry_run=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -s|--skip-build)
                skip_build=true
                shift
                ;;
            -r|--skip-registry)
                skip_registry=true
                shift
                ;;
            -c|--cleanup)
                cleanup_first=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                error "Unknown option: $1"
                ;;
        esac
    done
    
    # Set verbose mode
    if [ "$verbose" = true ]; then
        set -x
    fi
    
    # Dry run mode
    if [ "$dry_run" = true ]; then
        info "DRY RUN MODE - No changes will be made"
        info "Would execute:"
        info "  1. Check prerequisites"
        info "  2. Setup environment"
        if [ "$skip_build" = false ]; then
            info "  3. Build enterprise images"
            info "  4. Run security scan"
        fi
        if [ "$skip_registry" = false ]; then
            info "  5. Setup registry"
            info "  6. Push images to registry"
        fi
        info "  7. Deploy services"
        info "  8. Verify deployment"
        info "  9. Cleanup"
        exit 0
    fi
    
    # Start deployment
    log "Starting ProtoThrive Enterprise Docker Deployment"
    log "Log file: $LOG_FILE"
    
    # Cleanup if requested
    if [ "$cleanup_first" = true ]; then
        log "Cleaning up existing deployment..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" down -v || true
        docker-compose -f "$REGISTRY_COMPOSE_FILE" down -v || true
        docker system prune -f || true
    fi
    
    # Execute deployment steps
    check_prerequisites
    setup_environment
    
    if [ "$skip_build" = false ]; then
        build_images
        security_scan
    fi
    
    if [ "$skip_registry" = false ]; then
        setup_registry
        push_images
    fi
    
    deploy_services
    verify_deployment
    cleanup
    
    success "ProtoThrive Enterprise deployment completed successfully!"
    info "Check the log file for detailed information: $LOG_FILE"
}

# Run main function with all arguments
main "$@"
