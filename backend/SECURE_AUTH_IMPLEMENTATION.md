# Secure JWT Authentication & RBAC Implementation

## Overview
This implementation provides enterprise-grade JWT authentication with Role-Based Access Control (RBAC) for the ProtoThrive2 backend.

## Key Security Features

### 1. JWT Verification
- **Library**: Uses `jose` for cryptographically secure JWT operations
- **Signature Verification**: Validates JWT signatures using HMAC-SHA256 or RSA/ECDSA
- **Expiration Checks**: Automatically validates token expiration with configurable clock tolerance
- **Claims Validation**: Ensures required claims (sub/userId) are present

### 2. Role-Based Access Control (RBAC)
Five distinct roles with hierarchical permissions:

| Role | Roadmaps | Snippets | AI Agents | Premium Features | API Calls/Day |
|------|----------|----------|-----------|------------------|---------------|
| ADMIN | Unlimited | Unlimited | Unlimited | Yes | 10,000 |
| MANAGER | 100 | 500 | 50 | Yes | 5,000 |
| ENGINEER | 50 | 200 | 20 | Yes | 2,000 |
| CODER | 10 | 50 | 5 | No | 500 |
| USER | 3 | 10 | 1 | No | 100 |

### 3. Permission-Based Access
Granular permissions with wildcard support:
- `roadmap:*` - All roadmap operations
- `roadmap:create` - Create roadmaps
- `roadmap:update:own` - Update own roadmaps only
- `user:*` - All user management operations
- `admin:*` - All administrative operations

### 4. Ownership Validation
Routes can require resource ownership:
```typescript
app.put('/api/roadmaps/:id', requireOwnership('roadmap'), handler);
```

## Implementation Files

### `/backend/src/middleware/auth.ts`
Core authentication middleware with:
- `validateJwtMiddleware()` - Main JWT validation
- `requireRole(roles)` - Role-based access control
- `requirePermission(permissions)` - Permission-based access
- `requireOwnership(resourceType)` - Ownership validation

### `/backend/src/index.ts`
Updated routes using secure middleware:
- Protected API endpoints under `/api/*`
- Role-restricted admin endpoints
- Permission-based user management
- Ownership-required resource updates

## Environment Configuration

```env
# JWT Configuration
JWT_SECRET=your-256-bit-secret-key-minimum-32-chars
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...  # For RSA/ECDSA
JWT_ALGORITHM=HS256  # or RS256, ES256

# Environment
ENVIRONMENT=production  # development, staging, production
```

## Usage Examples

### 1. Basic Authentication
```typescript
// All /api/* routes require valid JWT
app.use('/api/*', validateJwtMiddleware);
```

### 2. Role-Based Access
```typescript
// Admin/Manager only
app.get('/api/admin/analytics',
  requireRole([UserRole.ADMIN, UserRole.MANAGER]),
  handler
);
```

### 3. Permission-Based Access
```typescript
// Requires specific permission
app.post('/api/snippets',
  requirePermission(['snippet:create']),
  handler
);
```

### 4. Ownership Validation
```typescript
// User can only update their own roadmaps
app.put('/api/roadmaps/:id',
  requireOwnership('roadmap'),
  handler
);
```

## Security Best Practices Implemented

1. **No Hard-Coded Secrets**: All secrets from environment variables
2. **Secure Token Storage**: Tokens validated but never stored
3. **Error Handling**: Generic error messages to prevent information leakage
4. **Clock Skew Tolerance**: 5-second tolerance for distributed systems
5. **Role Hierarchy**: Higher roles inherit lower role permissions
6. **Rate Limiting**: Role-based rate limits to prevent abuse
7. **Audit Logging**: All authentication events logged
8. **Development Mode**: Safe mock auth for development only

## Token Payload Structure

```json
{
  "sub": "user-uuid-123",        // User ID (required)
  "role": "engineer",            // User role (required)
  "email": "user@example.com",   // Email (optional)
  "permissions": ["..."],        // Custom permissions (optional)
  "exp": 1234567890,            // Expiration (required)
  "iat": 1234567890             // Issued at (optional)
}
```

## Testing

Run the comprehensive test suite:
```bash
cd backend
npm test auth.test.ts
```

Tests cover:
- Valid JWT verification
- Expired token rejection
- Invalid signature detection
- Missing claims validation
- Role hierarchy enforcement
- Permission wildcard matching
- Rate limit verification
- Clock skew handling

## Migration from Insecure Implementation

### Before (Insecure):
```typescript
// ❌ Splits token without verification
const parts = token.split('.');
const userId = parts[1]; // Unsafe!
c.set('user', { id: 'hardcoded', role: 'fixed' });
```

### After (Secure):
```typescript
// ✅ Proper JWT verification with jose
const user = await verifyJWT(token, env);
if (!user) throw new Error('Invalid token');
c.set('user', user); // Validated claims
```

## Production Deployment Checklist

- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure ENVIRONMENT=production
- [ ] Use RS256/ES256 for asymmetric signing (recommended)
- [ ] Enable HTTPS only (Strict-Transport-Security header)
- [ ] Configure CORS allowed origins
- [ ] Set up monitoring for auth failures
- [ ] Implement token refresh mechanism
- [ ] Configure session timeout policies
- [ ] Enable audit logging
- [ ] Test all role/permission combinations

## Compliance

This implementation supports:
- **GDPR**: User data access controls
- **SOC 2**: Role-based access audit trail
- **HIPAA**: Granular permission system
- **PCI DSS**: Secure token handling

## Support

For questions or issues:
- Review test cases in `/backend/tests/auth.test.ts`
- Check middleware implementation in `/backend/src/middleware/auth.ts`
- Verify route protection in `/backend/src/index.ts`