#!/bin/bash

# ProtoThrive Deployment Option Selector
# This script helps users choose between Cloudflare Edge and Docker deployments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

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

show_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    ProtoThrive Deployment                    ║"
    echo "║                   Choose Your Platform                       ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_cloudflare_option() {
    echo -e "${CYAN}🌐 Option 1: Cloudflare Edge Deployment${NC}"
    echo ""
    echo "✅ Benefits:"
    echo "   • Global performance (<50ms latency worldwide)"
    echo "   • Built-in security and DDoS protection"
    echo "   • Automatic scaling and zero cold starts"
    echo "   • Cost-effective pay-per-request pricing"
    echo "   • 200+ edge locations worldwide"
    echo "   • Automatic HTTPS and SSL certificates"
    echo ""
    echo "📊 Perfect for:"
    echo "   • Production applications with global users"
    echo "   • High-traffic applications"
    echo "   • Applications requiring maximum uptime"
    echo "   • Teams wanting managed infrastructure"
    echo ""
    echo "💰 Cost:"
    echo "   • Free tier: 100,000 requests/day"
    echo "   • Paid plans: $5/month for 10M requests"
    echo ""
}

show_docker_option() {
    echo -e "${YELLOW}🐳 Option 2: Traditional Docker Stack${NC}"
    echo ""
    echo "✅ Benefits:"
    echo "   • Full control over infrastructure"
    echo "   • Custom monitoring and logging"
    echo "   • On-premises deployment capability"
    echo "   • Maximum flexibility and customization"
    echo "   • Complete observability stack"
    echo "   • Self-hosted data and privacy"
    echo ""
    echo "📊 Perfect for:"
    echo "   • Enterprise environments with strict compliance"
    echo "   • Applications requiring custom infrastructure"
    echo "   • Teams with DevOps expertise"
    echo "   • On-premises or hybrid cloud deployments"
    echo ""
    echo "💰 Cost:"
    echo "   • Infrastructure costs (servers, databases, etc.)"
    echo "   • DevOps team time for maintenance"
    echo "   • Monitoring and security tools"
    echo ""
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if command -v docker &> /dev/null; then
        echo "✅ Docker is installed"
    else
        echo "❌ Docker is not installed"
        DOCKER_AVAILABLE=false
    fi
    
    # Check Wrangler
    if command -v wrangler &> /dev/null; then
        echo "✅ Wrangler CLI is installed"
    else
        echo "❌ Wrangler CLI is not installed"
        WRANGLER_AVAILABLE=false
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        echo "✅ Node.js is installed"
    else
        echo "❌ Node.js is not installed"
        NODE_AVAILABLE=false
    fi
    
    echo ""
}

get_user_choice() {
    echo -e "${GREEN}Which deployment option would you like to use?${NC}"
    echo ""
    echo "1) Cloudflare Edge Deployment (Recommended)"
    echo "2) Traditional Docker Stack"
    echo "3) Show detailed comparison"
    echo "4) Exit"
    echo ""
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            deploy_cloudflare
            ;;
        2)
            deploy_docker
            ;;
        3)
            show_detailed_comparison
            ;;
        4)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            log_error "Invalid choice. Please enter 1, 2, 3, or 4."
            get_user_choice
            ;;
    esac
}

deploy_cloudflare() {
    log_info "Setting up Cloudflare Edge deployment..."
    
    # Check if Wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler CLI is not installed. Installing..."
        npm install -g wrangler@latest
    fi
    
    # Check if logged in to Cloudflare
    if ! wrangler whoami &> /dev/null; then
        log_warning "Not logged in to Cloudflare. Please login:"
        wrangler login
    fi
    
    # Run Cloudflare deployment
    log_info "Starting Cloudflare deployment..."
    ./scripts/deploy-cloudflare.sh development
    
    log_success "Cloudflare deployment completed!"
    echo ""
    echo "🌐 Your application is now live on Cloudflare's global network!"
    echo "📊 Access your application at the URLs shown above."
}

deploy_docker() {
    log_info "Setting up Docker deployment..."
    
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
    
    # Run Docker deployment
    log_info "Starting Docker deployment..."
    ./scripts/deploy.sh
    
    log_success "Docker deployment completed!"
    echo ""
    echo "🐳 Your application is now running in Docker containers!"
    echo "📊 Access your application at http://localhost:3000"
}

show_detailed_comparison() {
    echo -e "${PURPLE}📊 Detailed Comparison${NC}"
    echo ""
    echo -e "${CYAN}Cloudflare Edge vs Docker Stack${NC}"
    echo ""
    echo "┌─────────────────────┬─────────────────────┬─────────────────────┐"
    echo "│ Feature             │ Cloudflare Edge     │ Docker Stack        │"
    echo "├─────────────────────┼─────────────────────┼─────────────────────┤"
    echo "│ Performance         │ <50ms globally      │ Depends on server   │"
    echo "│ Scalability         │ Automatic           │ Manual configuration│"
    echo "│ Security            │ Built-in WAF/DDoS   │ Custom setup        │"
    echo "│ Monitoring          │ Cloudflare Analytics│ Prometheus/Grafana  │"
    echo "│ Cost                │ Pay-per-request     │ Infrastructure costs│"
    echo "│ Maintenance         │ Managed             │ Self-managed        │"
    echo "│ Global Distribution │ 200+ edge locations │ Single/multi region │"
    echo "│ SSL/HTTPS           │ Automatic           │ Manual configuration│"
    echo "│ Backup/Recovery     │ Managed             │ Custom setup        │"
    echo "│ Compliance          │ SOC 2 Type II       │ Custom compliance   │"
    echo "│ Development         │ Wrangler dev        │ Docker compose      │"
    echo "└─────────────────────┴─────────────────────┴─────────────────────┘"
    echo ""
    
    get_user_choice
}

show_recommendations() {
    echo -e "${GREEN}💡 Recommendations${NC}"
    echo ""
    echo "For most users, we recommend:"
    echo ""
    echo "🌐 Cloudflare Edge if you:"
    echo "   • Want global performance out of the box"
    echo "   • Prefer managed infrastructure"
    echo "   • Have users worldwide"
    echo "   • Want to focus on application development"
    echo ""
    echo "🐳 Docker Stack if you:"
    echo "   • Need complete infrastructure control"
    echo "   • Have specific compliance requirements"
    echo "   • Want to run on-premises"
    echo "   • Have a dedicated DevOps team"
    echo ""
}

# Main function
main() {
    show_header
    show_cloudflare_option
    echo ""
    show_docker_option
    echo ""
    show_recommendations
    echo ""
    check_requirements
    get_user_choice
}

# Run main function
main
