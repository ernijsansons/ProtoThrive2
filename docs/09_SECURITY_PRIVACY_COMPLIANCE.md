# Security, Privacy & Compliance - ProtoThrive2

## Security Architecture

### Authentication Model
- **Type**: JWT-based stateless authentication
- **Token Storage**: HttpOnly cookies + localStorage (dual strategy)
- **Token Expiry**: 24 hours (configurable)
- **Refresh Strategy**: Planned implementation

### Authorization Model
- **Type**: Role-Based Access Control (RBAC)
- **Roles**:
  - `vibe_coder`: Standard user, create/edit own roadmaps
  - `engineer`: Advanced features, AI agent access
  - `exec`: Admin access, user management, analytics

### Multi-Tenancy Isolation
- **Strategy**: Row-level security via user_id filtering
- **Implementation**: All queries filtered at API layer
- **Validation**: Double-check ownership before mutations
- **Evidence**: backend/src/main.py:336 (queryRoadmap with user_id)

## OWASP Top 10 Compliance

### A01:2021 – Broken Access Control
- ✅ **Mitigation**: JWT validation on all protected routes
- ✅ **Implementation**: Ownership verification before CRUD operations
- ⚠️ **Gap**: Missing field-level permissions

### A02:2021 – Cryptographic Failures
- ✅ **Mitigation**: TLS 1.3 for all communications
- ✅ **Implementation**: Secrets in environment variables
- ⚠️ **Gap**: No application-level encryption for PII

### A03:2021 – Injection
- ✅ **Mitigation**: Parameterized queries via D1
- ✅ **Implementation**: Zod validation schemas
- ✅ **Evidence**: backend/src/main.py:399 (InputValidator)

### A04:2021 – Insecure Design
- ✅ **Mitigation**: Security middleware layer
- ✅ **Implementation**: Rate limiting, budget controls
- ⚠️ **Gap**: Missing threat modeling documentation

### A05:2021 – Security Misconfiguration
- ✅ **Mitigation**: Security headers configured
- ✅ **Implementation**: CORS properly configured
- ✅ **Evidence**: backend/src/main.py:89-96 (security headers)

### A06:2021 – Vulnerable Components
- ⚠️ **Gap**: No automated dependency scanning
- ⚠️ **Gap**: No SBOM generation in CI/CD
- 📋 **TODO**: Implement Snyk/Dependabot

### A07:2021 – Identification and Authentication Failures
- ✅ **Mitigation**: Strong password requirements
- ✅ **Implementation**: 2FA support (TwoFactorAuth.tsx)
- ⚠️ **Gap**: No account lockout mechanism

### A08:2021 – Software and Data Integrity Failures
- ✅ **Mitigation**: Code review process
- ⚠️ **Gap**: No signed commits requirement
- ⚠️ **Gap**: No integrity verification for CI/CD

### A09:2021 – Security Logging and Monitoring Failures
- ✅ **Mitigation**: Agent logs table for audit trail
- ✅ **Implementation**: Request ID tracking
- ⚠️ **Gap**: Missing security event alerting

### A10:2021 – Server-Side Request Forgery
- ✅ **Mitigation**: Allowlist for external services
- ✅ **Implementation**: No user-controlled URLs
- ✅ **Evidence**: All external calls to known services

## Input Validation

### Validation Layers
1. **Frontend**: TypeScript types + runtime validation
2. **API Gateway**: Zod schemas
3. **Database**: SQL constraints

### Validation Schemas
```typescript
// Roadmap validation (Zod)
const roadmapSchema = z.object({
  json_graph: z.string()
    .min(10)
    .max(100000)
    .refine(isValidJSON, "Invalid JSON"),
  vibe_mode: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived'])
});

// UUID validation
const uuidSchema = z.string().uuid();
```

### Sanitization
- HTML entities escaped in all outputs
- SQL injection prevented via parameterized queries
- XSS protection via Content-Security-Policy

## Data Classification

### Data Categories

| Category | Examples | Protection Level | Encryption |
|----------|----------|-----------------|------------|
| Public | Landing page content | None | No |
| Internal | Roadmap templates | Authentication | In transit |
| Confidential | User roadmaps | User isolation | At rest + transit |
| Sensitive | User emails, passwords | High isolation | Always encrypted |
| Regulated | Payment data (future) | PCI compliance | Tokenized |

## Privacy & GDPR Compliance

### Data Subject Rights
- ✅ **Right to Access**: User can export data
- ✅ **Right to Rectification**: User can edit profile
- ✅ **Right to Erasure**: Soft delete implemented
- ⚠️ **Right to Portability**: Partial (JSON export)
- ⚠️ **Right to Restriction**: Not implemented

### Privacy Implementation
```javascript
// Soft delete with GDPR compliance
async function deleteUser(userId) {
  // Soft delete user
  await db.prepare(`
    UPDATE users
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(userId).run();

  // Schedule hard delete after 72 hours
  await queue.send({
    type: 'PURGE_USER',
    userId,
    scheduledFor: Date.now() + 72 * 60 * 60 * 1000
  });
}
```

### Data Retention
- **Active Users**: Indefinite
- **Deleted Users**: 72 hours then purged
- **Audit Logs**: 7 years
- **Analytics**: 1 year aggregated

## Secrets Management

### Secret Storage
- **Development**: .env files (gitignored)
- **Production**: Cloudflare encrypted variables
- **CI/CD**: GitHub encrypted secrets

### Secret Rotation
```javascript
// Automatic secret rotation
const rotateSecrets = async () => {
  const newSecret = crypto.randomBytes(32).toString('hex');
  await env.KV.put('JWT_SECRET_NEW', newSecret);
  await env.KV.put('JWT_SECRET_OLD', currentSecret);
  await env.KV.put('SECRET_ROTATION_TIME', Date.now());
};
```

## Audit & Logging

### Audit Events Logged
- User authentication (login/logout)
- CRUD operations on roadmaps
- AI agent task execution
- Permission changes
- Failed authentication attempts
- Data exports/deletions

### Log Structure
```json
{
  "timestamp": "2025-09-22T00:00:00Z",
  "event_type": "ROADMAP_UPDATE",
  "user_id": "uuid-123",
  "resource_id": "roadmap-456",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "success": true,
  "metadata": {
    "fields_changed": ["json_graph", "status"]
  }
}
```

## Security Headers

### Current Implementation
```javascript
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": "default-src 'self'",
  "Strict-Transport-Security": "max-age=31536000",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

## Vulnerability Management

### Known Vulnerabilities
1. **TypeScript compilation errors** in frontend
   - Impact: Build failures
   - Severity: Medium
   - Status: In progress

2. **Missing rate limiting on some endpoints**
   - Impact: Potential DoS
   - Severity: Medium
   - Status: Planned

### Security Testing
- ⚠️ No automated security testing
- ⚠️ No penetration testing performed
- ⚠️ No static analysis (SAST) in CI/CD
- ⚠️ No dynamic analysis (DAST)

## Compliance Checklist

### GDPR
- [x] Privacy policy
- [x] Data processing agreement
- [x] Consent mechanisms
- [x] Data subject rights implementation
- [ ] Data Protection Officer appointed
- [ ] Privacy Impact Assessment

### SOC 2 (Future)
- [ ] Access controls
- [ ] Change management
- [ ] Risk assessment
- [ ] Vendor management
- [ ] Incident response

### PCI DSS (Future - when payments enabled)
- [ ] Network segmentation
- [ ] Encryption of cardholder data
- [ ] Access control measures
- [ ] Regular security testing

## Incident Response Plan

### Severity Levels
- **P0**: Complete outage, data breach
- **P1**: Partial outage, security vulnerability
- **P2**: Performance degradation
- **P3**: Minor issues

### Response Procedures
1. **Detect**: Monitoring alerts or user reports
2. **Assess**: Determine severity and impact
3. **Contain**: Isolate affected systems
4. **Eradicate**: Fix vulnerability
5. **Recover**: Restore normal operations
6. **Lessons**: Post-incident review

### Contact Chain
1. On-call engineer (PagerDuty)
2. Security team lead
3. CTO for P0/P1 incidents
4. Legal team for data breaches
5. PR team for public disclosure

## Security Recommendations

### High Priority
1. Implement automated dependency scanning
2. Add SAST/DAST to CI/CD pipeline
3. Enable account lockout after failed attempts
4. Implement field-level encryption for PII
5. Add security event alerting

### Medium Priority
1. Implement refresh token mechanism
2. Add rate limiting to all endpoints
3. Create threat model documentation
4. Implement CSP reporting
5. Add integrity checks for deployments

### Low Priority
1. Implement certificate pinning
2. Add HPKP headers
3. Implement subresource integrity
4. Add security.txt file
5. Implement feature flags for security controls

## Security Contacts
- **Security Email**: security@protothrive.com
- **Bug Bounty**: Not currently active
- **Responsible Disclosure**: 90 days