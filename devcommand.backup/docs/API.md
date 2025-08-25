# DevCommand API Documentation

## Base URL
- Production: `https://api.devcommand.com`
- Staging: `https://api-staging.devcommand.com`
- Local: `http://localhost:8787`

## Authentication

All API endpoints require authentication via Clerk JWT tokens in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- `vibe_coder`: Default role for new users
- `engineer`: Hired developers who can resolve HITL tasks
- `admin`: Full platform access

## Response Format

All responses follow this format:

```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* optional additional info */ }
  }
}
```

## Rate Limits

- **Anonymous users**: 30 requests/minute
- **Authenticated users**: 60 requests/minute
- **Agent tasks**: 10 requests/minute
- **Billing operations**: 5 requests/15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1705123456
```

## Endpoints

### Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-13T10:30:00.000Z",
  "environment": "production"
}
```

---

## Roadmaps API

### List Roadmaps

#### GET /api/roadmaps
Get all roadmaps for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "roadmap_123",
      "userId": "user_456",
      "jsonGraph": {
        "nodes": [...],
        "edges": [...]
      },
      "status": "active",
      "vibeMode": false,
      "thriveScore": 0.75,
      "createdAt": "2024-01-13T10:30:00.000Z",
      "updatedAt": "2024-01-13T12:45:00.000Z"
    }
  ]
}
```

### Get Roadmap

#### GET /api/roadmaps/:id
Get a specific roadmap by ID.

**Parameters:**
- `id` (string): Roadmap ID

**Response:** Same as individual roadmap object above.

### Create Roadmap

#### POST /api/roadmaps
Create a new roadmap.

**Request Body:**
```json
{
  "vision": "Build an AI-powered SaaS platform",
  "vibeMode": false
}
```

**Response:** Roadmap object with generated initial graph.

### Update Roadmap

#### PATCH /api/roadmaps/:id
Update an existing roadmap.

**Parameters:**
- `id` (string): Roadmap ID

**Request Body:**
```json
{
  "jsonGraph": {
    "nodes": [...],
    "edges": [...]
  },
  "status": "active",
  "vibeMode": true
}
```

**Response:** Updated roadmap object.

### Delete Roadmap

#### DELETE /api/roadmaps/:id
Soft delete a roadmap.

**Parameters:**
- `id` (string): Roadmap ID

**Response:**
```json
{
  "success": true,
  "data": { "deleted": true }
}
```

---

## AI Agents API

### Trigger Agent Task

#### POST /api/agents/trigger
Trigger an AI agent to perform a task.

**Request Body:**
```json
{
  "roadmapId": "roadmap_123",
  "taskType": "plan",
  "taskData": {
    "requirements": "Add user authentication",
    "priority": "high"
  }
}
```

**Task Types:**
- `plan`: Generate project plan
- `code`: Generate code
- `audit`: Audit existing code
- `deploy`: Deploy changes
- `enhance`: Enhance existing features

**Response:**
```json
{
  "success": true,
  "data": {
    "agentLogId": "log_789",
    "status": "pending",
    "message": "Agent task triggered successfully"
  }
}
```

### Get Agent Status

#### GET /api/agents/status/:logId
Get the status of an agent task.

**Parameters:**
- `logId` (string): Agent log ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "log_789",
    "roadmapId": "roadmap_123",
    "taskType": "plan",
    "status": "completed",
    "output": "Generated project plan with 15 tasks...",
    "errorMessage": null,
    "tokenCount": 1250,
    "modelUsed": "claude-3",
    "timestamp": "2024-01-13T10:30:00.000Z"
  }
}
```

### Get Agent Logs

#### GET /api/agents/logs/:roadmapId
Get all agent logs for a roadmap.

**Parameters:**
- `roadmapId` (string): Roadmap ID

**Response:** Array of agent log objects.

### Resolve HITL Task

#### POST /api/agents/hitl/resolve
Resolve a Human-in-the-Loop task (engineers only).

**Request Body:**
```json
{
  "taskId": "hitl_123",
  "resolution": "approved",
  "output": "Code review completed, changes approved"
}
```

**Response:**
```json
{
  "success": true,
  "data": { "resolved": true }
}
```

---

## Billing API

### Get Subscription

#### GET /api/billing/subscription
Get current user's subscription details.

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": "pro",
    "status": "active",
    "features": {
      "maxRoadmaps": 10,
      "maxAgentTasks": 100,
      "maxApiCalls": 10000,
      "maxStorage": "10GB"
    },
    "currentPeriodStart": "2024-01-01T00:00:00.000Z",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z"
  }
}
```

### Create Checkout Session

#### POST /api/billing/checkout
Create a Stripe checkout session.

**Request Body:**
```json
{
  "tier": "pro",
  "returnUrl": "https://app.devcommand.com/dashboard",
  "cancelUrl": "https://app.devcommand.com/billing"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_123...",
    "sessionId": "cs_123..."
  }
}
```

### Get Usage Statistics

#### GET /api/billing/usage
Get current usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": "pro",
    "usage": {
      "roadmaps": { "used": 5, "limit": 10 },
      "agentTasks": { "used": 45, "limit": 100 },
      "apiCalls": { "used": 3200, "limit": 10000 }
    }
  }
}
```

---

## WebSocket API

### Connection

Connect to real-time updates via WebSocket:

```
wss://api.devcommand.com/api/ws/:roadmapId?token=<jwt-token>
```

### Message Format

All WebSocket messages follow this format:
```json
{
  "type": "message_type",
  "userId": "user_123",
  "data": { /* message data */ },
  "timestamp": 1705123456789
}
```

### Message Types

#### Client → Server

**update**: Broadcast graph changes
```json
{
  "type": "update",
  "data": {
    "nodes": [...],
    "edges": [...]
  }
}
```

**cursor**: Share cursor position
```json
{
  "type": "cursor",
  "data": { "x": 100, "y": 200 }
}
```

**selection**: Share node selection
```json
{
  "type": "selection",
  "data": { "nodeId": "node_123" }
}
```

#### Server → Client

**init**: Initial connection data
```json
{
  "type": "init",
  "data": {
    "roadmapId": "roadmap_123",
    "participants": [
      { "userId": "user_123", "userEmail": "user@example.com" }
    ]
  }
}
```

**presence**: User presence updates
```json
{
  "type": "presence",
  "data": {
    "participants": [...],
    "sessionCount": 3
  }
}
```

---

## GraphQL API

Access GraphQL playground at: `https://api.devcommand.com/graphql`

### Example Queries

```graphql
query GetRoadmaps {
  roadmaps {
    id
    status
    thriveScore
    jsonGraph {
      nodes {
        id
        type
        position { x y z }
        data { label status }
      }
      edges {
        id
        source
        target
      }
    }
  }
}
```

```graphql
mutation CreateRoadmap($vision: String!, $vibeMode: Boolean) {
  createRoadmap(vision: $vision, vibeMode: $vibeMode) {
    id
    status
    jsonGraph {
      nodes { id }
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `INVALID_INPUT` | Request validation failed |
| `RATE_LIMITED` | Too many requests |
| `QUOTA_EXCEEDED` | Subscription limit reached |
| `PAYMENT_FAILED` | Payment processing error |
| `INTERNAL_ERROR` | Server error |

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { DevCommandAPI } from '@devcommand/sdk';

const client = new DevCommandAPI({
  baseURL: 'https://api.devcommand.com',
  apiKey: 'your-jwt-token'
});

// Create roadmap
const roadmap = await client.roadmaps.create({
  vision: 'Build an AI-powered SaaS platform',
  vibeMode: true
});

// Trigger agent
const task = await client.agents.trigger({
  roadmapId: roadmap.id,
  taskType: 'plan'
});
```

### Python

```python
from devcommand import DevCommandAPI

client = DevCommandAPI(
    base_url="https://api.devcommand.com",
    api_key="your-jwt-token"
)

# Create roadmap
roadmap = client.roadmaps.create(
    vision="Build an AI-powered SaaS platform",
    vibe_mode=True
)

# Trigger agent
task = client.agents.trigger(
    roadmap_id=roadmap.id,
    task_type="plan"
)
```