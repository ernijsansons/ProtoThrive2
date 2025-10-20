# ProtoThrive Backend Architecture

## Overview

The ProtoThrive backend follows a clean, layered architecture designed for maintainability, testability, and scalability. This document outlines the architecture patterns and design decisions.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           HTTP Request                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Route Handlers Layer              │
│   (HTTP, Validation, Response Format)    │
│                                          │
│  • auth.routes.ts                        │
│  • roadmap.routes.ts (future)            │
│  • snippet.routes.ts (future)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Service Layer                    │
│      (Business Logic)                    │
│                                          │
│  • AuthService                           │
│  • RoadmapService                        │
│  • SnippetService                        │
│  • MFAService                            │
│  • GDPRService                           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Repository Layer                   │
│      (Data Access)                       │
│                                          │
│  • BaseRepository (generic CRUD)         │
│  • UserRepository                        │
│  • RoadmapRepository                     │
│  • SnippetRepository                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Data Layer                       │
│   (D1 Database, KV Cache)                │
└─────────────────────────────────────────┘
```

## Design Patterns

### 1. Repository Pattern

**Purpose**: Abstract data access logic from business logic

**Implementation**:
- `BaseRepository<T>`: Generic repository with common CRUD operations
- Type-safe with TypeScript generics
- Built-in caching with Cloudflare KV
- Soft delete support
- Pagination support

**Example**:
```typescript
class UserRepository extends BaseRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    // Custom query logic with caching
  }
}
```

**Benefits**:
- DRY (Don't Repeat Yourself)
- Easy to test with mocks
- Consistent data access patterns
- Cache invalidation handled automatically

### 2. Service Layer Pattern

**Purpose**: Encapsulate business logic separate from route handlers

**Implementation**:
- Services orchestrate multiple repositories
- Handle validation and business rules
- Manage transactions and error handling
- No HTTP concerns (req/res objects)

**Example**:
```typescript
class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JWTService,
    private passwordService: PasswordService
  ) {}

  async login(email: string, password: string): Promise<LoginResult> {
    // Business logic here
  }
}
```

**Benefits**:
- Testable without HTTP layer
- Reusable across different interfaces (REST, GraphQL, CLI)
- Clear separation of concerns
- Easy to add new features

### 3. Dependency Injection

**Purpose**: Loose coupling between components

**Implementation**:
- Constructor injection for dependencies
- Services and repositories injected via constructors
- Easy to mock for testing

**Example**:
```typescript
// In route handler
const authService = new AuthService(
  c.env.DB,
  c.env.JWT_SECRET,
  c.env.KV_STORE
);
```

**Benefits**:
- Easy to test with mocks
- Flexible configuration
- Clear dependency tree

## File Structure

```
backend/
├── src/
│   ├── routes/                    # Route handlers
│   │   ├── auth.routes.ts         # Authentication routes
│   │   └── ...
│   │
│   ├── services/                  # Business logic
│   │   ├── auth.service.ts        # Authentication logic
│   │   ├── roadmap.service.ts     # Roadmap management
│   │   ├── snippet.service.ts     # Snippet management
│   │   ├── mfa.service.ts         # Multi-factor auth
│   │   ├── gdpr.service.ts        # GDPR compliance
│   │   ├── monitoring.service.ts  # Monitoring & metrics
│   │   └── pwned-passwords.service.ts
│   │
│   ├── repositories/              # Data access layer
│   │   ├── base.repository.ts     # Generic CRUD operations
│   │   ├── user.repository.ts     # User data access
│   │   ├── roadmap.repository.ts  # Roadmap data access
│   │   └── snippet.repository.ts  # Snippet data access
│   │
│   ├── utils/                     # Utilities
│   │   ├── jwt.service.ts         # JWT token management
│   │   ├── password.service.ts    # Password hashing/validation
│   │   ├── db.ts                  # Database utilities
│   │   ├── auth.ts                # Auth helpers
│   │   └── validation.ts          # Zod schemas
│   │
│   ├── middleware/                # Middleware functions
│   │   ├── auth.middleware.ts     # Authentication
│   │   ├── mfa.middleware.ts      # MFA enforcement
│   │   └── rateLimiting.ts        # Rate limiting
│   │
│   ├── migrations/                # Database migrations
│   │   ├── 001_init.sql
│   │   ├── 002_add_roadmaps.sql
│   │   └── ...
│   │
│   ├── __tests__/                 # Test suites
│   │   ├── unit/                  # Unit tests
│   │   │   ├── services/          # Service layer tests
│   │   │   ├── repositories/      # Repository tests
│   │   │   └── utils/             # Utility tests
│   │   ├── integration/           # Integration tests
│   │   ├── security/              # Security tests
│   │   └── e2e/                   # End-to-end tests
│   │
│   └── index.ts                   # Application entry point
│
├── migrations/                    # SQL migration files
├── coverage/                      # Test coverage reports
├── jest.config.js                 # Jest configuration
├── tsconfig.json                  # TypeScript configuration
├── wrangler.toml                  # Cloudflare Workers config
└── sonar-project.properties       # SonarCloud config
```

## Key Components

### BaseRepository

Generic repository providing CRUD operations:

**Methods**:
- `findById(id)` - Find entity by ID with caching
- `findAll(options)` - Find all with pagination
- `create(data)` - Create new entity
- `update(id, data)` - Update existing entity
- `delete(id)` - Soft delete entity
- `hardDelete(id)` - Permanently delete
- `executeInTransaction(fn)` - Transaction support

**Features**:
- Type-safe with generics
- Automatic cache invalidation
- Soft delete support
- Pagination built-in
- UUID generation

### Services

#### AuthService
- User registration with breach detection
- Login with brute force protection
- Token generation and refresh
- Password change and reset
- MFA integration hooks

#### RoadmapService
- CRUD operations with authorization
- Thrive score calculation
- Node/edge validation
- Search and filtering
- Clone functionality

#### SnippetService
- CRUD operations with validation
- Language and category filtering
- Usage tracking
- Search by tags/content
- Code analysis

### Repositories

#### UserRepository
- Email-based user lookup
- Role and tenant filtering
- Login attempt tracking
- Account locking/unlocking
- MFA management
- User anonymization (GDPR)

#### RoadmapRepository
- User and tenant roadmap queries
- Status filtering
- Thrive score updates
- Search functionality
- Statistics and analytics

#### SnippetRepository
- Language and category queries
- Tag-based search
- Usage tracking
- Popularity metrics
- Statistics by user

## Data Flow Examples

### User Registration Flow

```
1. POST /api/auth/register
   ↓
2. auth.routes.ts
   - Validates input with Zod schema
   - Rate limiting check
   ↓
3. AuthService.register()
   - Password complexity validation
   - HaveIBeenPwned breach check
   - Hash password with PBKDF2
   ↓
4. UserRepository.create()
   - Insert user into D1 database
   - Cache user data in KV
   ↓
5. JWTService.createToken()
   - Generate access token
   - Generate refresh token
   ↓
6. Response
   - Return user + tokens
   - 201 Created status
```

### Roadmap Creation Flow

```
1. POST /api/roadmaps
   ↓
2. roadmap.routes.ts (future)
   - Validates input with Zod
   - Authenticates user via middleware
   ↓
3. RoadmapService.createRoadmap()
   - Verify user exists
   - Validate title/nodes/edges
   - Check node/edge constraints
   ↓
4. RoadmapRepository.create()
   - Insert roadmap into database
   - Store nodes/edges as JSON
   ↓
5. RoadmapService.calculateThriveScore()
   - Calculate completion percentage
   - Compute complexity score
   - Update roadmap with score
   ↓
6. Response
   - Return created roadmap
   - 201 Created status
```

## Testing Strategy

### Unit Tests
- Test individual functions in isolation
- Mock all dependencies
- Fast execution (<100ms per test)
- 95%+ code coverage target

**Example**:
```typescript
describe('AuthService', () => {
  it('should register user successfully', async () => {
    // Mock repositories
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.create.mockResolvedValue(mockUser);

    // Test service method
    const result = await authService.register(email, password, name);

    // Assertions
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
- Test multiple layers together
- Use real database (D1 local)
- Validate complete workflows
- 60+ test scenarios

### Security Tests
- SQL injection attempts
- XSS attack vectors
- CSRF bypass attempts
- Authentication bypass tests
- 250+ penetration tests

### E2E Tests
- Full user journeys
- Browser automation with Playwright
- Cross-browser testing
- 50+ scenarios

## Performance Optimizations

### Caching Strategy

```
Request → Check KV Cache → If miss → Query D1 → Store in KV → Return
                          ↓ If hit
                       Return from cache
```

**Cache TTL**:
- User data: 3600s (1 hour)
- Roadmap data: 1800s (30 minutes)
- Snippet data: 3600s (1 hour)

**Cache Invalidation**:
- Automatic on update/delete operations
- Cache keys: `{table}:{id}` or `{table}:{field}:{value}`

### Query Optimization
- Strategic indexes on frequently queried columns
- Composite indexes for multi-column queries
- LIMIT clauses for large result sets
- Pagination for list endpoints

### Database Performance
- Connection pooling (handled by D1)
- Prepared statements (SQL injection prevention + performance)
- Batch operations where possible
- Avoid N+1 queries

## Security Measures

### Authentication
- JWT with HMAC-SHA256 signing
- 15-minute access tokens
- 7-day refresh tokens
- Token blacklisting on logout

### Password Security
- PBKDF2 hashing (100k iterations)
- Salt generated per password
- HaveIBeenPwned breach checking
- Complexity requirements enforced

### Authorization
- User ID from JWT payload
- Owner-based access control
- Tenant-based data isolation
- Role-based permissions

### Rate Limiting
- 5 registration attempts per 15 minutes
- 10 login attempts per 5 minutes
- Adaptive throttling based on patterns
- Account locking after failed attempts

### Input Validation
- Zod schema validation
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF token validation

## Migration Strategy

### Database Migrations
1. Create new migration file: `migrations/XXX_description.sql`
2. Increment version number
3. Add to migration management system
4. Test locally with Wrangler
5. Deploy to production via CI/CD

### Code Migration (from monolithic index.ts)
1. ✅ **Phase 1**: Extract route handlers
   - Create modular route files
   - Move validation to routes

2. ✅ **Phase 2**: Create repository layer
   - Build BaseRepository
   - Implement entity-specific repos

3. ✅ **Phase 3**: Build service layer
   - Extract business logic
   - Inject repositories

4. 🔄 **Phase 4**: Refactor index.ts
   - Use new routes/services
   - Remove duplicated code
   - Maintain backward compatibility

## Code Quality Standards

### SonarCloud Quality Gates
- **Coverage**: ≥95%
- **Duplications**: ≤3%
- **Maintainability Rating**: A
- **Reliability Rating**: A
- **Security Rating**: A

### Complexity Limits
- **Function complexity**: ≤15
- **File complexity**: ≤200
- **Lines per file**: ≤500
- **Lines per function**: ≤50

### Code Style
- **ESLint**: Airbnb TypeScript config
- **Prettier**: Consistent formatting
- **Comments**: 20-30% comment density
- **Naming**: Clear, descriptive names

## Future Enhancements

### Short Term (Phase 5)
- [ ] Durable Objects for distributed rate limiting
- [ ] API versioning (/api/v1/)
- [ ] GraphQL API layer
- [ ] WebSocket support for real-time updates

### Medium Term
- [ ] Event sourcing for audit trail
- [ ] CQRS pattern for read/write separation
- [ ] Redis integration for advanced caching
- [ ] Message queue for async operations

### Long Term
- [ ] Microservices decomposition
- [ ] gRPC for inter-service communication
- [ ] Kubernetes deployment
- [ ] Multi-region data replication

## Troubleshooting

### Common Issues

**Issue**: "Repository not defined"
- **Cause**: Missing dependency injection
- **Solution**: Pass repository to service constructor

**Issue**: "Cache miss rate high"
- **Cause**: Short TTL or high update frequency
- **Solution**: Increase TTL or optimize invalidation

**Issue**: "Slow queries"
- **Cause**: Missing indexes
- **Solution**: Add composite index in migration

**Issue**: "Test failures in CI"
- **Cause**: Mock not configured correctly
- **Solution**: Verify mock return values match interface

## Resources

- [CLAUDE.md](../CLAUDE.md) - Complete project documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Last Updated**: September 2025
**Version**: 2.0.0
**Maintainer**: ProtoThrive Engineering Team
