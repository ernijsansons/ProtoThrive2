# ProtoThrive Enterprise Docker Setup

This document provides comprehensive instructions for deploying ProtoThrive in an enterprise environment using Docker and Docker Compose.

## 🏗️ Architecture Overview

The enterprise setup includes two deployment options:

### Option 1: Cloudflare Edge (Recommended)
- **Frontend**: Cloudflare Pages (Next.js static generation)
- **Backend**: Cloudflare Workers (TypeScript/Hono API)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Cache**: Cloudflare KV (Key-value storage)
- **CDN**: Cloudflare's global network (200+ cities)
- **Security**: Built-in DDoS protection and WAF

### Option 2: Traditional Docker Stack
- **Frontend**: Next.js application with optimized production build
- **Backend**: Cloudflare Workers API with enterprise features
- **Database**: PostgreSQL with production optimizations
- **Cache**: Redis for session management and caching
- **Reverse Proxy**: Nginx with SSL termination and security headers
- **Monitoring**: Prometheus, Grafana, and ELK stack
- **Tracing**: Jaeger for distributed tracing
- **Storage**: MinIO for object storage
- **Email**: Mailhog for development/testing

## 📋 Prerequisites

### System Requirements
- Docker 20.10+
- Docker Compose 2.0+
- 8GB RAM minimum (16GB recommended)
- 50GB disk space
- Linux/macOS/Windows with WSL2

### Required Software
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🚀 Quick Start

### Choose Your Deployment Option

**For Cloudflare Edge Deployment (Recommended):**
- Global performance with <50ms latency
- Built-in security and DDoS protection
- Automatic scaling and zero cold starts
- Cost-effective pay-per-request pricing
- See [Cloudflare Deployment Guide](./cloudflare-deployment.md)

**For Traditional Docker Stack:**
- Full control over infrastructure
- Custom monitoring and logging
- On-premises deployment capability
- Complex setup but maximum flexibility

### 1. Clone and Setup
```bash
git clone <repository-url>
cd ProtoThrive2
cp env.example .env
```

### 2. Configure Environment
Edit `.env` file with your production values:
```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# JWT and Encryption
JWT_SECRET=your_jwt_secret_minimum_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Firebase (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config

# Monitoring
GRAFANA_PASSWORD=your_grafana_password

# MinIO
MINIO_ROOT_PASSWORD=your_minio_password
```

### 3. Deploy
```bash
# Development deployment
./scripts/deploy.sh

# Production deployment
./scripts/deploy.sh production
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `POSTGRES_PASSWORD` | Database password | Yes | - |
| `REDIS_PASSWORD` | Redis password | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `ENCRYPTION_KEY` | Data encryption key | Yes | - |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | Yes | - |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | Yes | - |
| `GRAFANA_PASSWORD` | Grafana admin password | Yes | - |
| `MINIO_ROOT_PASSWORD` | MinIO root password | Yes | - |

### Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js application |
| Backend | 8787 | API server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Nginx | 80/443 | Reverse proxy |
| Grafana | 3001 | Monitoring dashboard |
| Prometheus | 9090 | Metrics collection |
| Kibana | 5601 | Log analysis |
| Jaeger | 16686 | Distributed tracing |
| MinIO | 9000/9001 | Object storage |

## 📊 Monitoring and Observability

### Grafana Dashboards
Access Grafana at `http://localhost:3001`
- Default credentials: `admin` / `{GRAFANA_PASSWORD}`
- Pre-configured dashboards for:
  - Application metrics
  - Database performance
  - Infrastructure monitoring
  - Security events

### Prometheus Metrics
Access Prometheus at `http://localhost:9090`
- Application metrics
- System metrics
- Custom business metrics

### Log Analysis
Access Kibana at `http://localhost:5601`
- Centralized logging
- Log aggregation and analysis
- Real-time log monitoring

### Distributed Tracing
Access Jaeger at `http://localhost:16686`
- Request tracing across services
- Performance bottleneck identification
- Service dependency mapping

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Two-factor authentication support
- Password policy enforcement

### Data Protection
- Encryption at rest and in transit
- Secure key management
- Data backup and recovery
- GDPR compliance features

### Network Security
- SSL/TLS termination
- Security headers
- Rate limiting
- IP whitelisting/blacklisting

### Monitoring
- Security event logging
- Failed login detection
- Suspicious activity alerts
- Audit trail

## 🗄️ Database Management

### Initial Setup
The database is automatically initialized with:
- User management tables
- Project and roadmap tables
- Collaboration session tables
- Audit logging tables
- **SECURITY**: Admin credentials must be configured via environment variables (see Security section)

### Backup and Recovery
```bash
# Create backup
./scripts/deploy.sh backup

# Restore from backup
docker-compose exec postgres psql -U protothrive -d protothrive < backup.sql
```

### Database Migrations
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Check migration status
docker-compose exec backend npm run migrate:status
```

## 🚀 Production Deployment

### Production Override
Use the production override file for optimized settings:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### SSL Configuration
1. Obtain SSL certificates
2. Place certificates in `nginx/ssl/`
3. Update `nginx/nginx.conf` with SSL configuration
4. Restart nginx service

### Load Balancing
For high availability, deploy multiple instances:
```bash
# Scale frontend
docker-compose up -d --scale frontend=3

# Scale backend
docker-compose up -d --scale backend=2
```

## 🔧 Maintenance

### Health Checks
```bash
# Check service health
./scripts/deploy.sh status

# View logs
./scripts/deploy.sh logs

# Restart services
./scripts/deploy.sh restart
```

### Updates
```bash
# Pull latest images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Cleanup
```bash
# Remove unused resources
docker system prune -f

# Remove unused volumes (be careful!)
docker volume prune -f
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker-compose logs [service-name]

# Check resource usage
docker stats

# Restart specific service
docker-compose restart [service-name]
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready -U protothrive

# Check database logs
docker-compose logs postgres
```

#### Memory Issues
```bash
# Check memory usage
docker stats

# Increase memory limits in docker-compose.yml
# Restart services
docker-compose restart
```

### Performance Optimization

#### Database Optimization
- Monitor query performance
- Add appropriate indexes
- Optimize connection pooling
- Regular VACUUM and ANALYZE

#### Application Optimization
- Enable gzip compression
- Optimize images and assets
- Use CDN for static content
- Implement caching strategies

## 📞 Support

### Documentation
- [API Documentation](./docs/api.md)
- [Frontend Documentation](./docs/frontend.md)
- [Backend Documentation](./docs/backend.md)

### Monitoring
- Check Grafana dashboards for system health
- Monitor Prometheus alerts
- Review application logs in Kibana

### Contact
- Technical Support: support@protothrive.com
- Security Issues: security@protothrive.com
- General Inquiries: info@protothrive.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This is an enterprise-grade setup designed for production use. Ensure you have proper security measures in place and follow your organization's security policies when deploying.
