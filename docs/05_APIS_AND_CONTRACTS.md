# APIs & Contracts - ProtoThrive2

## API Overview
- **Base URL Production**: https://backend-thermo.ernijs-ansons.workers.dev
- **Base URL Staging**: https://backend-thermo-staging.ernijs-ansons.workers.dev
- **Protocol**: HTTPS only
- **Format**: JSON (application/json)
- **Authentication**: JWT Bearer token

## Authentication

### Headers Required
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## REST API Endpoints

### Health & Status

#### GET /health
Check system health and database connectivity.

**Request**: None required

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": 1234567890,
  "database": {
    "connected": true,
    "latency_ms": 12
  },
  "cache": {
    "connected": true
  },
  "version": "1.0.0"
}
```

### Authentication Endpoints

#### GET /auth/validate
Validate current JWT token.

**Headers**: Authorization required

**Response** (200 OK):
```json
{
  "valid": true,
  "user": {
    "id": "uuid-thermo-1",
    "email": "user@example.com",
    "role": "vibe_coder"
  },
  "expires_at": 1234567890
}
```

**Error** (401 Unauthorized):
```json
{
  "error": "Invalid or expired token",
  "code": "AUTH-401"
}
```

#### GET /auth/dev-tokens
Get development tokens for testing (dev environment only).

**Response** (200 OK):
```json
{
  "tokens": {
    "vibe_coder": "eyJ...",
    "engineer": "eyJ...",
    "exec": "eyJ..."
  }
}
```

### Roadmap Management

#### GET /api/roadmaps
List user's roadmaps with pagination.

**Query Parameters**:
- `limit` (integer, default: 10, max: 100): Number of results
- `offset` (integer, default: 0): Pagination offset
- `status` (string, optional): Filter by status (draft|active|completed|archived)

**Response** (200 OK):
```json
{
  "roadmaps": [
    {
      "id": "rm-uuid-1",
      "user_id": "user-uuid",
      "json_graph": {
        "nodes": [
          {
            "id": "n1",
            "label": "Start",
            "status": "gray",
            "position": {"x": 0, "y": 0, "z": 0}
          }
        ],
        "edges": [
          {"from": "n1", "to": "n2"}
        ]
      },
      "status": "active",
      "vibe_mode": true,
      "thrive_score": 0.75,
      "created_at": "2025-09-22T00:00:00Z",
      "updated_at": "2025-09-22T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 25
  }
}
```

#### GET /api/roadmaps/:id
Get specific roadmap by ID.

**Path Parameters**:
- `id` (string, required): Roadmap UUID

**Response** (200 OK):
```json
{
  "roadmap": {
    "id": "rm-uuid-1",
    "user_id": "user-uuid",
    "json_graph": {...},
    "status": "active",
    "vibe_mode": true,
    "thrive_score": 0.75,
    "created_at": "2025-09-22T00:00:00Z",
    "updated_at": "2025-09-22T00:00:00Z"
  },
  "user": "user-uuid"
}
```

**Error** (404 Not Found):
```json
{
  "error": "Roadmap not found",
  "code": "GRAPH-404"
}
```

#### POST /api/roadmaps
Create new roadmap.

**Request Body**:
```json
{
  "json_graph": {
    "nodes": [...],
    "edges": [...]
  },
  "vibe_mode": true,
  "status": "draft"
}
```

**Response** (201 Created):
```json
{
  "roadmap": {
    "id": "new-uuid",
    "user_id": "user-uuid",
    ...
  },
  "message": "Roadmap created successfully"
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "error": "Invalid JSON graph structure",
  "code": "VAL-400",
  "details": ["json_graph must be valid JSON"]
}
```

#### PUT /api/roadmaps/:id
Update existing roadmap.

**Path Parameters**:
- `id` (string, required): Roadmap UUID

**Request Body**:
```json
{
  "json_graph": {...},
  "status": "active",
  "thrive_score": 0.85
}
```

**Response** (200 OK):
```json
{
  "roadmap_id": "rm-uuid-1",
  "updated_fields": ["json_graph", "status", "thrive_score"],
  "message": "Roadmap updated successfully"
}
```

#### DELETE /api/roadmaps/:id
Soft delete roadmap.

**Path Parameters**:
- `id` (string, required): Roadmap UUID

**Response** (200 OK):
```json
{
  "roadmap_id": "rm-uuid-1",
  "message": "Roadmap deleted successfully",
  "deleted_at": 1234567890
}
```

### Snippet Management

#### GET /api/snippets
List available code snippets.

**Query Parameters**:
- `category` (string, optional): Filter by category (ui|auth|deploy|etc)
- `limit` (integer, default: 20): Number of results

**Response** (200 OK):
```json
{
  "snippets": [
    {
      "id": "sn-uuid-1",
      "category": "ui",
      "code": "console.log('UI Component');",
      "ui_preview_url": "https://preview.url/image.png",
      "version": 1,
      "created_at": "2025-09-22T00:00:00Z"
    }
  ],
  "total": 50
}
```

#### POST /api/snippets
Create new snippet.

**Request Body**:
```json
{
  "category": "ui",
  "code": "// New component code",
  "ui_preview_url": "https://preview.url"
}
```

**Response** (201 Created):
```json
{
  "snippet": {
    "id": "new-sn-uuid",
    ...
  },
  "message": "Snippet created successfully"
}
```

### Agent Orchestration

#### POST /api/agent/run
Execute AI agent task.

**Request Body**:
```json
{
  "task": "Generate authentication flow",
  "context": {
    "json_graph": {...},
    "requirements": "OAuth2 with refresh tokens"
  },
  "budget": 0.30,
  "mode": "fallback"
}
```

**Headers** (optional):
- `X-Agent-Budget`: Override budget (float)
- `X-Agent-Mode`: Override mode (single|fallback|ensemble)

**Response** (200 OK):
```json
{
  "result": {
    "code": "// Generated authentication code...",
    "confidence": 0.92,
    "agent": "enterprise_v3.4"
  },
  "metrics": {
    "cost_actual": 0.25,
    "cost_estimated": 0.28,
    "tokens_used": 1500,
    "time_ms": 3200
  },
  "trace": [
    {
      "agent": "enterprise_v3.4",
      "attempt": 1,
      "success": true,
      "confidence": 0.92
    }
  ]
}
```

**Error** (402 Payment Required):
```json
{
  "error": "Budget exceeded",
  "code": "COST-402",
  "details": {
    "requested_budget": 0.30,
    "minimum_required": 0.45
  }
}
```

## WebSocket API

### Connection
```
ws://backend-thermo.ernijs-ansons.workers.dev/ws
```

### Authentication
Send after connection:
```json
{
  "type": "auth",
  "token": "Bearer <JWT_TOKEN>"
}
```

### Events

#### Roadmap Updates
```json
{
  "type": "roadmap_update",
  "roadmap_id": "rm-uuid-1",
  "changes": {
    "nodes": [...],
    "edges": [...]
  },
  "user_id": "user-who-made-change",
  "timestamp": 1234567890
}
```

#### Presence
```json
{
  "type": "presence",
  "roadmap_id": "rm-uuid-1",
  "users": [
    {
      "id": "user-1",
      "name": "Alice",
      "cursor": {"x": 100, "y": 200}
    }
  ]
}
```

## Error Codes

### Standard HTTP Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: Invalid HTTP method
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Custom Error Codes
- `VAL-400`: Validation error
- `AUTH-401`: Authentication failed
- `AUTH-403`: Authorization failed
- `GRAPH-404`: Roadmap not found
- `COST-402`: Budget exceeded
- `ERR-500`: Generic server error
- `BUDGET-429`: Task budget exceeded
- `DB-500`: Database error

## Rate Limiting
- **Requests per minute**: 100 (authenticated)
- **Requests per minute**: 20 (unauthenticated)
- **WebSocket connections**: 100 concurrent per user
- **Agent tasks per hour**: 10 per user

## Versioning
API version included in response headers:
```
X-API-Version: 1.0.0
```

Future versions will use URL versioning:
```
/api/v2/roadmaps
```

## Data Validation Schemas (Zod)

### Roadmap Schema
```typescript
{
  json_graph: z.string().min(10).refine(isValidJSON),
  vibe_mode: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional(),
  thrive_score: z.number().min(0).max(1).optional()
}
```

### Snippet Schema
```typescript
{
  category: z.string().min(1).max(50),
  code: z.string().min(1).max(10000),
  ui_preview_url: z.string().url().optional()
}
```

## CORS Configuration
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```