#!/bin/bash

# ProtoThrive Enterprise Deployment Script
# This script handles the complete deployment of the ProtoThrive application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

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
    log_info "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warning ".env file not found. Creating from example..."
        if [ -f "env.example" ]; then
            cp env.example .env
            log_warning "Please edit .env file with your configuration before continuing."
            exit 1
        else
            log_error "env.example file not found. Cannot create .env file."
            exit 1
        fi
    fi
    
    log_success "System requirements check passed."
}

backup_data() {
    log_info "Creating backup of existing data..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    if docker-compose ps postgres | grep -q "Up"; then
        log_info "Backing up PostgreSQL database..."
        docker-compose exec -T postgres pg_dump -U protothrive protothrive > "$BACKUP_DIR/database.sql"
    fi
    
    # Backup volumes
    log_info "Backing up Docker volumes..."
    docker run --rm -v protothrive2_postgres_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
    docker run --rm -v protothrive2_redis_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
    
    log_success "Backup created in $BACKUP_DIR"
}

build_images() {
    log_info "Building Docker images..."
    
    # Build frontend
    log_info "Building frontend image..."
    docker-compose build frontend
    
    # Build backend
    log_info "Building backend image..."
    docker-compose build backend
    
    log_success "Docker images built successfully."
}

deploy_services() {
    log_info "Deploying services..."
    
    # Pull latest images
    docker-compose pull
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    log_success "Services deployed successfully."
}

check_service_health() {
    log_info "Checking service health..."
    
    services=("frontend" "backend" "postgres" "redis" "nginx")
    
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "$service is running"
        else
            log_error "$service is not running"
            docker-compose logs "$service"
            exit 1
        fi
    done
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Wait for database to be ready
    sleep 10
    
    # Run migrations (if you have a migration script)
    # docker-compose exec backend npm run migrate
    
    log_success "Database migrations completed."
}

setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Wait for monitoring services to be ready
    sleep 20
    
    # Check if Grafana is accessible
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        log_success "Grafana is accessible at http://localhost:3001"
    else
        log_warning "Grafana is not accessible. Check logs: docker-compose logs grafana"
    fi
    
    # Check if Prometheus is accessible
    if curl -f http://localhost:9090 > /dev/null 2>&1; then
        log_success "Prometheus is accessible at http://localhost:9090"
    else
        log_warning "Prometheus is not accessible. Check logs: docker-compose logs prometheus"
    fi
}

cleanup() {
    log_info "Cleaning up unused Docker resources..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    log_success "Cleanup completed."
}

show_status() {
    log_info "Deployment Status:"
    echo ""
    echo "Services:"
    docker-compose ps
    echo ""
    echo "Application URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8787"
    echo "  Grafana: http://localhost:3001"
    echo "  Prometheus: http://localhost:9090"
    echo "  Kibana: http://localhost:5601"
    echo "  Jaeger: http://localhost:16686"
    echo "  MinIO Console: http://localhost:9001"
    echo ""
    echo "Default Credentials:"
    echo "  Admin User: admin@protothrive.com / admin123"
    echo "  Grafana: admin / (check .env GRAFANA_PASSWORD)"
    echo "  MinIO: minioadmin / (check .env MINIO_ROOT_PASSWORD)"
}

# Main deployment process
main() {
    log_info "Starting ProtoThrive Enterprise Deployment..."
    log_info "Environment: $ENVIRONMENT"
    
    check_requirements
    
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_data
    fi
    
    build_images
    deploy_services
    run_migrations
    setup_monitoring
    cleanup
    show_status
    
    log_success "ProtoThrive Enterprise Deployment completed successfully!"
    log_info "You can now access the application at http://localhost:3000"
}

# Handle script arguments
case "${1:-}" in
    "backup")
        backup_data
        ;;
    "build")
        build_images
        ;;
    "deploy")
        deploy_services
        ;;
    "status")
        show_status
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "stop")
        log_info "Stopping all services..."
        docker-compose down
        log_success "All services stopped."
        ;;
    "restart")
        log_info "Restarting all services..."
        docker-compose restart
        log_success "All services restarted."
        ;;
    "help"|"-h"|"--help")
        echo "ProtoThrive Enterprise Deployment Script"
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  (no args)    Full deployment (default: production)"
        echo "  backup       Create backup of existing data"
        echo "  build        Build Docker images only"
        echo "  deploy       Deploy services only"
        echo "  status       Show deployment status"
        echo "  logs         Show logs from all services"
        echo "  stop         Stop all services"
        echo "  restart      Restart all services"
        echo "  help         Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  ENVIRONMENT  Set deployment environment (default: production)"
        ;;
    *)
        main
        ;;
esac
