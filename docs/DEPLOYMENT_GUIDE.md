# ProtoThrive Deployment Guide

## Overview
ProtoThrive offers flexible deployment options to meet different organizational needs. This guide covers Cloudflare Workers (recommended), Docker containers, and hybrid deployments.

## Quick Start
```bash
# Choose your deployment method
./scripts/choose-deployment.sh

# Or deploy directly to Cloudflare (recommended)
./scripts/deploy-cloudflare.sh production

# Or use Docker stack
./scripts/deploy.sh production
```

## Deployment Options

### Option 1: Cloudflare Edge (Recommended)
Best for global applications requiring low latency and high availability.

**Benefits:**
- 🌍 Global edge network (200+ locations)
- ⚡ Sub-50ms response times worldwide
- 🔒 Built-in DDoS protection and WAF
- 📈 Auto-scaling with zero configuration
- 💰 Cost-effective pay-per-request model
- 🚀 Zero-downtime deployments

#### Prerequisites
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify installation
wrangler whoami
```

#### Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd ProtoThrive2

# Copy environment template
cp env.example .env

# Edit configuration
vim .env
```

**Required Environment Variables:**
```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Database
D1_DATABASE_ID=your-d1-database-id
KV_NAMESPACE_ID=your-kv-namespace-id

# API Keys
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
ENTERPRISE_AGENT_TOKEN=your-agent-token

# Security
JWT_SECRET=your-jwt-secret-32-chars-minimum
ENCRYPTION_KEY=your-encryption-key
```

#### Cloudflare Resource Setup

**1. D1 Database Creation**
```bash
# Create D1 database
wrangler d1 create protothrive-db

# Note the database ID for .env configuration
# Copy the binding configuration to wrangler.toml
```

**2. KV Namespace Creation**
```bash
# Create KV namespace
wrangler kv:namespace create "protothrive-kv"

# Create preview namespace for testing
wrangler kv:namespace create "protothrive-kv" --preview

# Note the namespace IDs for wrangler.toml
```

**3. R2 Bucket (Optional - for file uploads)**
```bash
# Create R2 bucket for assets
wrangler r2 bucket create protothrive-assets
```

#### Configuration Files

**wrangler.toml (Backend)**
```toml
name = "protothrive-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Environment variables
[env.development]
name = "protothrive-backend-dev"
vars = { ENVIRONMENT = "development" }

[env.staging]
name = "protothrive-backend-staging"
vars = { ENVIRONMENT = "staging" }

[env.production]
name = "protothrive-backend"
vars = { ENVIRONMENT = "production" }

# Database binding
[[d1_databases]]
binding = "DB"
database_name = "protothrive-db"
database_id = "your-d1-database-id"

# KV binding
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"

# R2 binding (optional)
[[r2_buckets]]
binding = "ASSETS"
bucket_name = "protothrive-assets"

# Secrets (set via wrangler secret put)
[env.production.secrets]
JWT_SECRET = "your-jwt-secret"
OPENAI_API_KEY = "your-openai-key"
ANTHROPIC_API_KEY = "your-anthropic-key"
```

#### Deployment Steps

**1. Backend Deployment**
```bash
cd backend

# Install dependencies
npm install

# Run database migrations
wrangler d1 execute protothrive-db --file=migrations/001_init.sql --env production

# Set secrets
wrangler secret put JWT_SECRET --env production
wrangler secret put OPENAI_API_KEY --env production
wrangler secret put ANTHROPIC_API_KEY --env production

# Deploy backend
wrangler deploy --env production
```

**2. Frontend Deployment**
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy out --project-name protothrive

# Or use Pages integration with Git
# Connect your repository to Cloudflare Pages dashboard
```

**3. Automated Deployment Script**
```bash
# Full deployment with all components
./scripts/deploy-cloudflare.sh production

# Backend only
./scripts/deploy-cloudflare.sh production backend

# Frontend only
./scripts/deploy-cloudflare.sh production frontend
```

### Option 2: Docker Stack
Best for on-premises deployments, custom environments, or full control requirements.

**Benefits:**
- 🔧 Complete infrastructure control
- 🏢 On-premises deployment support
- 📊 Custom monitoring and logging
- 🔒 Enhanced security and compliance
- 🛠️ Extensible and customizable

#### Docker Compose Setup

**docker-compose.prod.yml**
```yaml
version: '3.8'
services:
  # Frontend (Next.js)
  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:8787
    depends_on:
      - backend
    restart: unless-stopped

  # Backend (Hono API)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8787:8787"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/protothrive
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # Database (PostgreSQL)
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=protothrive
      - POSTGRES_USER=protothrive
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

  # Cache (Redis)
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Enterprise Agent
  enterprise-agent:
    build:
      context: ./enterprise-agent
      dockerfile: Dockerfile
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./enterprise-agent/configs:/app/configs
    restart: unless-stopped

  # Nginx Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  # Monitoring (Prometheus + Grafana)
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

#### Docker Deployment

**1. Prepare Environment**
```bash
# Copy production environment template
cp .env.example .env.production

# Configure production variables
vim .env.production

# Generate SSL certificates (for HTTPS)
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt
```

**2. Deploy Stack**
```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

**3. Database Setup**
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Seed initial data (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Option 3: Hybrid Deployment
Combine Cloudflare's edge capabilities with custom infrastructure for specific needs.

**Architecture:**
- Frontend: Cloudflare Pages
- API Gateway: Cloudflare Workers
- Backend Services: Custom infrastructure (AWS/GCP/Azure)
- Database: Managed service (RDS/Cloud SQL/etc.)

```bash
# Deploy frontend to Cloudflare Pages
cd frontend && wrangler pages deploy out

# Deploy API gateway to Cloudflare Workers  
cd backend && wrangler deploy --env production

# Deploy backend services to cloud provider
# (use cloud-specific deployment tools)
```

## Environment Configuration

### Development Environment
```bash
# Start development servers
npm run dev:backend &    # Backend on :8787
npm run dev:frontend &   # Frontend on :3000
npm run dev:agent &      # Enterprise agent

# Or use Docker for development
docker-compose up -d
```

### Staging Environment
```bash
# Deploy to staging
./scripts/deploy-cloudflare.sh staging

# Run integration tests
npm run test:integration

# Performance testing
npm run test:performance
```

### Production Environment
```bash
# Deploy to production
./scripts/deploy-cloudflare.sh production

# Health checks
curl https://your-domain.com/health

# Monitor logs
wrangler tail --env production
```

## Database Management

### Migrations
```bash
# Create new migration
npm run migration:create "add_user_preferences"

# Run migrations
npm run migration:run

# Rollback migrations
npm run migration:rollback
```

### Backup and Restore
```bash
# Cloudflare D1 backup
wrangler d1 backup create protothrive-db

# PostgreSQL backup (Docker)
docker-compose exec postgres pg_dump -U protothrive protothrive > backup.sql

# Restore from backup
docker-compose exec -T postgres psql -U protothrive protothrive < backup.sql
```

## Security Configuration

### SSL/TLS Setup
```bash
# Cloudflare: Automatic SSL (no configuration needed)

# Docker: Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt

# Production: Use Let's Encrypt with certbot
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

### Environment Variables Security
```bash
# Use encrypted environment files
ansible-vault encrypt .env.production

# Or use cloud secret managers
# AWS Secrets Manager, Google Secret Manager, Azure Key Vault
```

### Firewall Configuration
```bash
# Basic UFW setup (Ubuntu)
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Cloudflare: WAF rules configured in dashboard
```

## Monitoring and Logging

### Application Monitoring
```bash
# Health check endpoints
GET /health
GET /health/database
GET /health/enterprise-agent

# Metrics endpoints
GET /metrics
GET /metrics/performance
GET /metrics/costs
```

### Log Aggregation
```yaml
# Docker logging
version: '3.8'
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Performance Monitoring
```bash
# Cloudflare Analytics (automatic)
# Real User Monitoring enabled by default

# Custom metrics with Prometheus
# Grafana dashboards included in monitoring/
```

## Scaling Configuration

### Cloudflare Workers Scaling
- Automatic scaling to handle millions of requests
- No configuration required
- Global edge deployment

### Docker Scaling
```bash
# Scale specific services
docker-compose up -d --scale backend=3

# Use Docker Swarm for multi-node scaling
docker swarm init
docker stack deploy -c docker-compose.prod.yml protothrive
```

### Database Scaling
```sql
-- Read replicas configuration
-- Connection pooling with pgpool
-- Sharding strategies for large datasets
```

## Troubleshooting

### Common Issues

**1. Wrangler Authentication Issues**
```bash
# Clear and re-authenticate
wrangler logout
wrangler login

# Check authentication status
wrangler whoami
```

**2. Database Connection Issues**
```bash
# Test D1 connection
wrangler d1 execute protothrive-db --command "SELECT 1"

# Check database bindings in wrangler.toml
```

**3. Frontend Build Issues**
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check environment variables
npm run build:debug
```

**4. Enterprise Agent Issues**
```bash
# Check agent status
curl http://localhost:8787/api/agent/health

# Review agent logs
docker-compose logs enterprise-agent

# Test agent connectivity
python scripts/test-agent-connection.py
```

### Log Analysis
```bash
# Cloudflare Workers logs
wrangler tail --env production

# Docker container logs
docker-compose logs -f backend

# System logs
journalctl -u docker
```

### Performance Issues
```bash
# Profile application
npm run profile

# Analyze bundle size
npm run analyze

# Database query optimization
EXPLAIN ANALYZE SELECT ...
```

## Rollback Procedures

### Cloudflare Rollback
```bash
# List recent deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback [deployment-id]
```

### Docker Rollback
```bash
# Tag and rollback to previous image
docker tag current-image:latest current-image:rollback
docker-compose up -d
```

### Database Rollback
```bash
# Run migration rollback
npm run migration:rollback

# Restore from backup
./scripts/restore-database.sh backup-timestamp
```

## Cost Optimization

### Cloudflare Optimization
- Use Cloudflare's free tier for development
- Monitor usage in Cloudflare dashboard
- Implement caching strategies
- Optimize bundle sizes

### Docker Optimization
- Use multi-stage builds
- Optimize image sizes
- Implement resource limits
- Use local caching for development

## Maintenance

### Regular Tasks
```bash
# Update dependencies
npm audit fix
npm update

# Clean up Docker resources
docker system prune -a

# Rotate logs
logrotate /etc/logrotate.conf

# Security updates
apt update && apt upgrade
```

### Backup Schedule
```bash
# Daily database backups
0 2 * * * /scripts/backup-database.sh

# Weekly full system backup
0 3 * * 0 /scripts/backup-full-system.sh

# Monthly security audits
0 4 1 * * /scripts/security-audit.sh
```

This comprehensive deployment guide covers all aspects of getting ProtoThrive running in production environments, from simple Cloudflare deployments to complex hybrid architectures.