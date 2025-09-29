# ProtoThrive Production Deployment Guide

**Version**: 2.0.0
**Last Updated**: September 28, 2025
**Status**: Production Ready (with security improvements needed)

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Deployment Steps](#deployment-steps)
5. [Security Configuration](#security-configuration)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [API Documentation](#api-documentation)

---

## Deployment Overview

ProtoThrive is deployed as a modern serverless application using Cloudflare's edge computing platform:

- **Backend**: Cloudflare Workers (Hono-based TypeScript API)
- **Frontend**: Cloudflare Pages (Next.js React application)
- **Database**: Cloudflare D1 (SQLite-based)
- **Storage**: Cloudflare KV (caching) and R2 (file storage)

### Current Deployment URLs

- **Backend API**: https://protothrive-backend.ernijs-ansons.workers.dev
- **Frontend**: https://876017e2.protothrive-frontend.pages.dev

### Deployment Status

✅ **Functional**: All core endpoints operational
✅ **Performance**: Sub-500ms response times
✅ **Scalability**: Handles concurrent load effectively
⚠️ **Security**: Requires security header implementation

---

## System Architecture

```
Internet
    ↓
Cloudflare Edge Network (275+ locations)
    ↓
┌─────────────────┬─────────────────┐
│   Frontend      │    Backend      │
│ (Cloudflare     │ (Cloudflare     │
│  Pages)         │  Workers)       │
│                 │                 │
│ - Next.js 14    │ - Hono API      │
│ - React 18      │ - TypeScript    │
│ - Tailwind CSS  │ - JWT Auth      │
│ - Zustand       │ - Rate Limiting │
└─────────────────┴─────────────────┘
    ↓                       ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   D1 Database   │   KV Storage    │   R2 Storage    │
│ (Persistent)    │   (Caching)     │ (File Storage)  │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Prerequisites

### Development Environment

- Node.js 20.0.0 or higher
- npm 10.0.0 or higher
- Git 2.40.0 or higher
- Cloudflare account (Workers Paid plan recommended)

### Required Tools

```bash
# Install Wrangler CLI
npm install -g wrangler

# Verify installation
wrangler --version
node --version
npm --version
```

### Cloudflare Setup

1. **Account**: Cloudflare account with Workers enabled
2. **Domain**: Custom domain (optional but recommended)
3. **API Token**: Cloudflare API token with appropriate permissions

---

## Deployment Steps

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd ProtoThrive2

# Install dependencies
npm install

# Install workspace dependencies
npm run install-all
```

### 2. Environment Configuration

Create and configure environment variables:

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:
```bash
NODE_ENV=production
JWT_SECRET=your_64_character_minimum_jwt_secret_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

### 3. Database Setup

```bash
# Create D1 database
wrangler d1 create protothrive-db-prod

# Update wrangler.toml with database ID
# Run initial migration
wrangler d1 execute protothrive-db-prod --file=backend/migrations/001_init.sql
```

### 4. Backend Deployment

```bash
# Deploy backend to Cloudflare Workers
cd backend
wrangler deploy --env production

# Verify deployment
curl https://your-backend-url.workers.dev/health
```

### 5. Frontend Deployment

```bash
# Build and deploy frontend
cd frontend
npm run build
npx wrangler pages deploy .next --project-name protothrive-frontend

# Verify deployment
curl https://your-frontend-url.pages.dev
```

### 6. Domain Configuration (Optional)

```bash
# Add custom domain
wrangler pages domain add your-domain.com

# Configure DNS
# Add CNAME record pointing to your-frontend-url.pages.dev
```

---

## Security Configuration

### Current Security Issues

Based on the security audit, the following issues need immediate attention:

#### Critical Priority

1. **Security Headers Missing**
   - Strict-Transport-Security
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection
   - Content-Security-Policy

2. **Authentication Issues**
   - Invalid token handling needs improvement
   - Rate limiting not implemented

#### Implementation Required

Add security headers to the backend middleware:

```typescript
// Add to backend/src/middleware/security.ts
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

### Security Checklist

- [ ] Implement security headers
- [ ] Add rate limiting middleware
- [ ] Improve authentication token validation
- [ ] Enable CSRF protection
- [ ] Implement input sanitization
- [ ] Add API request logging
- [ ] Configure CSP for frontend

---

## Performance Optimization

### Current Performance Metrics

- **API Response Time**: 400-500ms average
- **Frontend Load Time**: 500ms average
- **Concurrent User Capacity**: 100+ users tested
- **Success Rate**: 100% under normal load

### Optimization Strategies

1. **Caching Configuration**
   ```typescript
   // Cache static responses
   const cacheHeaders = {
     'Cache-Control': 'public, max-age=3600',
     'CDN-Cache-Control': 'max-age=86400'
   };
   ```

2. **Database Query Optimization**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
   CREATE INDEX idx_roadmaps_created_at ON roadmaps(created_at);
   ```

3. **Bundle Size Optimization**
   ```javascript
   // Enable tree shaking and code splitting
   module.exports = {
     optimization: {
       usedExports: true,
       sideEffects: false
     }
   };
   ```

---

## Monitoring & Maintenance

### Health Monitoring

**Endpoints to Monitor**:
- `GET /health` - Basic health check
- `GET /api/status` - Detailed system status
- `GET /api/roadmaps` - Core functionality test

**Monitoring Setup**:
```bash
# Basic uptime monitoring
curl -f https://your-backend-url.workers.dev/health || exit 1

# Response time monitoring
curl -w "@curl-format.txt" -o /dev/null -s https://your-backend-url.workers.dev/health
```

### Log Analysis

Monitor Cloudflare Workers logs:
```bash
# View live logs
wrangler tail

# View specific time range
wrangler tail --since 2025-09-28T10:00:00Z
```

### Performance Metrics

Track key metrics:
- Response time percentiles (P50, P95, P99)
- Error rates by endpoint
- Request volume trends
- Database query performance

---

## Troubleshooting

### Common Issues

#### 1. Deployment Failures

**Symptom**: Wrangler deploy fails
```bash
Error: Build failed
```

**Solution**:
```bash
# Check TypeScript compilation
npm run build

# Clear build cache
rm -rf .next node_modules
npm install
npm run build
```

#### 2. Database Connection Issues

**Symptom**: Database not yet configured message
```json
{"message": "Database not yet configured"}
```

**Solution**:
```bash
# Verify D1 database binding
wrangler d1 list

# Check wrangler.toml configuration
# Ensure database_id matches created database
```

#### 3. CORS Issues

**Symptom**: Frontend cannot connect to backend
```
Access to fetch blocked by CORS policy
```

**Solution**:
```typescript
// Update CORS origin in backend
app.use('*', cors({
  origin: ['https://your-frontend-domain.pages.dev']
}));
```

#### 4. Authentication Errors

**Symptom**: 401 Unauthorized responses
```json
{"error": "Missing or invalid authorization header"}
```

**Solution**:
```javascript
// Include Bearer token in requests
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Debug Mode

Enable debug logging:
```bash
# Set log level
export LOG_LEVEL=debug

# View detailed logs
wrangler tail --debug
```

---

## API Documentation

### Authentication

All protected endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Health & Status
```http
GET /health
GET /api/status
```

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
```

#### Roadmaps
```http
GET    /api/roadmaps
POST   /api/roadmaps
GET    /api/roadmaps/:id
PUT    /api/roadmaps/:id
POST   /api/roadmaps/:id/thrive-score
```

#### Snippets
```http
GET    /api/snippets
POST   /api/snippets
```

### Request/Response Examples

#### Create Roadmap
```http
POST /api/roadmaps
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Product Roadmap",
  "description": "Q1 2025 product development roadmap",
  "nodes": [
    {
      "id": "1",
      "type": "feature",
      "data": {"label": "User Authentication"}
    }
  ],
  "edges": []
}
```

#### Response
```json
{
  "data": {"id": "rm-12345"},
  "message": "Roadmap created successfully"
}
```

---

## Next Steps

### Immediate Actions Required

1. **Security Implementation** (Priority: High)
   - Add security headers middleware
   - Implement rate limiting
   - Improve authentication handling

2. **Custom Domain Setup** (Priority: Medium)
   - Configure production domain
   - Update CORS origins
   - Set up SSL certificates

3. **Database Schema** (Priority: Medium)
   - Complete database migrations
   - Add proper indexes
   - Implement data validation

4. **Monitoring Setup** (Priority: Medium)
   - Configure uptime monitoring
   - Set up error alerting
   - Implement performance tracking

### Future Enhancements

- AI agent integration
- Real-time collaboration features
- Advanced analytics dashboard
- Mobile responsive improvements
- Automated backup system

---

## Support & Resources

- **Documentation**: [CLAUDE.md](./CLAUDE.md)
- **Issue Tracking**: GitHub Issues
- **Performance Reports**: [Load Test Results](./load_test_results.json)
- **Security Audit**: [Security Audit Results](./security_audit_results.json)

**Deployment Status**: ✅ Ready for production (with security improvements)
**Recommended Action**: Implement security headers before public launch

---

*This deployment guide is automatically updated based on system testing and validation results.*